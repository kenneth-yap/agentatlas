import { Architecture } from "../types";

export const graphRag: Architecture = {
  id: "graph-rag",
  number: 27,
  name: "GraphRAG",
  part: 6,
  tagline: "Knowledge graph + community summaries for 'big picture' questions",
  controlFlow: "conditional",
  loopType: "none",
  memoryType: "networkx",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "2 per query (+ 1 per doc and per community at ingestion)",
  keyDifferentiator: "Vector RAG can only fetch chunks similar to the question, so it can't answer 'what are the main themes?'. GraphRAG pre-computes summaries of graph communities at ingestion time; global questions read those summaries, local questions walk entity neighbourhoods.",
  color: "#0ea5e9",
  paradigm: "deliberative",
  conceptualInsight: "Moves work from query time to index time — the same trade-off as a materialised view. Community summaries are pre-aggregated answers to questions no single chunk can answer.",
  a1a5Profile: {
    a1input: "Question; corpus that was ingested into a graph once (12 docs → triples)",
    a2decision: "LLM classifies scope (local | global) and target entities; Python builds context from graph or summaries",
    a3memory: "NetworkX knowledge graph of (subject, predicate, object) triples + greedy-modularity communities + one LLM summary per community",
    a4coordination: "None — classify → build context → answer",
    a5output: "Answer grounded in graph facts (local) or community summaries (global)",
  },
  whenToUse: [
    { useCase: "'What are the main themes?' questions", reason: "Global sense-making over a whole corpus — where vector top-k fails." },
    { useCase: "Entity-centric corpora (companies, people, products)", reason: "Triples make relationships explicit and traversable." },
    { useCase: "Corpora queried far more often than they change", reason: "Expensive ingestion is paid once and amortised over many queries." },
  ],
  strengths: [
    "Answers global, corpus-level questions",
    "Explicit, inspectable entity relationships",
    "Cheap per-query cost after ingestion",
    "Local and global modes from one index",
  ],
  weaknesses: [
    "Expensive ingestion (demo: 114.6 s for 12 docs)",
    "Triple extraction can miss or garble facts",
    "Summaries go stale when the corpus changes",
    "Single flat community level (the paper is hierarchical)",
  ],
  comparedTo: [
    { name: "Graph / World-Model Memory", insight: "#12 answers by generating Cypher queries over Neo4j. GraphRAG adds community detection and pre-written summaries for global questions." },
    { name: "Agentic RAG", insight: "Vector retrieval finds similar chunks; GraphRAG finds connected facts and corpus-wide themes." },
  ],
  references: [
    { kind: "origin", authors: "Edge et al.", year: 2024, title: "From Local to Global: A Graph RAG Approach to Query-Focused Summarization", venue: "arXiv preprint (Microsoft Research)", url: "https://arxiv.org/abs/2404.16130", note: "The paper builds a hierarchy of communities (Leiden) and map-reduces over summaries. This notebook uses one flat level of greedy-modularity communities." },
    { kind: "background", authors: "Hogan et al.", year: 2021, title: "Knowledge Graphs", venue: "ACM Computing Surveys 54(4)", url: "https://arxiv.org/abs/2003.02320" },
  ],
  nodes: [
    { id: "start",         type: "start",  label: "START",            x: 200, y: 20 },
    { id: "ingest",        type: "memory", label: "Ingest: triples\n+ communities", x: 440, y: 120, description: "Memory (index time): LLM extracts triples per doc → NetworkX graph → communities → one LLM summary each" },
    { id: "classify",      type: "llm",    label: "Classify\nScope",   x: 200, y: 150, description: "LLM: local | global + target entities" },
    { id: "build_context", type: "rule",   label: "Build\nContext",    x: 200, y: 300, description: "Rule: global → all community summaries; local → 2-hop entity neighbourhood facts" },
    { id: "answer",        type: "llm",    label: "Answer",            x: 200, y: 440, description: "LLM: answer from the built context" },
    { id: "end",           type: "end",    label: "END",               x: 200, y: 560 },
  ],
  edges: [
    { id: "e1", source: "start",         target: "classify" },
    { id: "e2", source: "ingest",        target: "build_context", label: "graph + summaries" },
    { id: "e3", source: "classify",      target: "build_context" },
    { id: "e4", source: "build_context", target: "answer" },
    { id: "e5", source: "answer",        target: "end" },
  ],
  demoInput: "(local) Who founded Stardust Aerospace and where is it located?  (global) What are the main themes in the knowledge base?",
  demoOutput: "Ingestion: 5 communities, sizes [16, 10, 9, 7, 5], 114.6 s.\n\nLocal (628 chars of graph facts): \"Founded by Dr. Amara Okonkwo and Jin-ho Park; located in Reno, Nevada.\"\n\nGlobal (2,498 chars of community summaries):\n1. Company Overview  2. Spacecraft and Vehicles  3. …",
  executionTrace: [
    { activeNodeId: "ingest",        label: "Index time — Ingest", stateSnapshot: { documents: 12, communities: 5, community_sizes: [16, 10, 9, 7, 5] }, explanation: "Runs once in the constructor: extract triples, build the graph, detect communities, summarise each with the LLM." },
    { activeNodeId: "classify",      label: "Query — Classify", stateSnapshot: { question: "What are the main themes?", scope: "global", target_entities: [] }, explanation: "The scope decision picks which half of the index to read." },
    { activeNodeId: "build_context", label: "Build context", stateSnapshot: { scope: "global", context_chars: 2498 }, explanation: "Global: concatenate all 5 community summaries. (Local would pull up to 15 two-hop facts per entity.)" },
    { activeNodeId: "answer",        label: "Answer", stateSnapshot: { final_answer: "1. Company Overview 2. Spacecraft and Vehicles …" }, explanation: "The LLM synthesises themes from pre-computed summaries — something no single retrieved chunk contains." },
  ],
  codeSnippets: {
    classify: `class _QuestionScope(BaseModel):
    scope: Literal["local", "global"]
    target_entities: list[str] = []   # 1-3 names when local
    rationale: str`,
    build_context: `def _build_context(self, state):
    if state["scope"] == "global":
        ctx = "\\n\\n".join(self.community_summaries)
    else:
        lines = []
        for ent in state["target_entities"]:
            for f in self.semantic.facts_about(ent, depth=2)[:15]:
                lines.append(f"{f['subject']} --[{f['predicate']}]--> {f['object']}")
        ctx = "\\n".join(lines)
    return {"context_block": ctx}`,
    ingest: `class _IngestionTriple(BaseModel):
    subject: str     # specific named entity
    predicate: str   # snake_case relation
    object: str

# at construction time
communities = nx.community.greedy_modularity_communities(graph)
summaries = [llm.invoke(f"Summarise these facts:\\n{facts(c)}").content
             for c in communities[:max_communities]]`,
  },
};
