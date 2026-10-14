import { Architecture } from "../types";

export const correctiveRag: Architecture = {
  id: "corrective-rag",
  number: 24,
  name: "Corrective RAG",
  part: 6,
  tagline: "Grade retrieved docs; fall back to web search when they're poor",
  controlFlow: "conditional",
  loopType: "none",
  memoryType: "vector",
  toolUse: true,
  llmDriven: true,
  llmCallsPerTask: "k grades + 1 answer (k = top_k, default 3)",
  keyDifferentiator: "Adds a quality gate between retrieval and generation. Each document gets a categorical grade (relevant / ambiguous / irrelevant); Python counts the grades and routes to use_retrieved, use_web or use_mixed.",
  color: "#0ea5e9",
  paradigm: "hybrid",
  conceptualInsight: "Retrieval is treated as an unreliable upstream service. The grader is a circuit-breaker: when the internal corpus can't answer, fail over to a secondary source (web) instead of letting the generator hallucinate over irrelevant context.",
  a1a5Profile: {
    a1input: "User question; internal vector corpus; optional web-search function (Tavily)",
    a2decision: "LLM grades each doc categorically; Python routing on the relevant fraction (threshold 0.5)",
    a3memory: "FAISS corpus + per-question doc grades in state",
    a4coordination: "None — fixed pipeline with one conditional branch",
    a5output: "Answer grounded in retrieved docs, web snippets or both, plus the route taken",
  },
  whenToUse: [
    { useCase: "Corpora with known coverage gaps", reason: "Out-of-corpus questions fall back to the web instead of being answered from irrelevant chunks." },
    { useCase: "When precision matters more than latency", reason: "Grading every doc costs one LLM call each but filters noise." },
    { useCase: "Diagnosing retrieval quality", reason: "Grade counts per question are a free retrieval-quality metric." },
  ],
  strengths: [
    "Explicit retrieval-quality signal",
    "Graceful fallback for out-of-corpus questions",
    "Categorical grades + Python routing — no numeric LLM scores",
    "Route is logged, so failures are easy to debug",
  ],
  weaknesses: [
    "One LLM call per retrieved doc",
    "Web results can be noisy too (demo: Iceland question still unanswered)",
    "Routing is all-or-nothing per question, not per claim",
    "Correct routes can still produce weak answers (demo: Falcon 9 comparison)",
  ],
  comparedTo: [
    { name: "Self-RAG", insight: "CRAG grades docs to decide where to get evidence. Self-RAG grades docs to decide which evidence to keep, and can skip retrieval entirely." },
    { name: "Agentic RAG", insight: "Agentic RAG decides whether to retrieve. CRAG decides whether what it retrieved is good enough." },
  ],
  references: [
    { kind: "origin", authors: "Yan et al.", year: 2024, title: "Corrective Retrieval Augmented Generation", venue: "arXiv preprint", url: "https://arxiv.org/abs/2401.15884", note: "The paper uses a fine-tuned lightweight evaluator plus a decompose-then-recompose filter; this notebook uses an LLM grader and passes whole docs." },
    { kind: "background", authors: "Lewis et al.", year: 2020, title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", venue: "NeurIPS 2020", url: "https://arxiv.org/abs/2005.11401" },
  ],
  nodes: [
    { id: "start",      type: "start",  label: "START",          x: 200, y: 20 },
    { id: "retrieve",   type: "memory", label: "Retrieve\ntop-k", x: 200, y: 120, description: "Memory: FAISS search over the internal corpus" },
    { id: "grade",      type: "llm",    label: "Grade\nEach Doc", x: 200, y: 230, description: "LLM ×k: relevant | ambiguous | irrelevant" },
    { id: "route",      type: "rule",   label: "Route",           x: 200, y: 340, description: "Rule: ≥50% relevant → use_retrieved; all irrelevant → use_web; else use_mixed" },
    { id: "web_search", type: "tool",   label: "Web\nSearch",     x: 440, y: 400, description: "Tool: Tavily search for fallback evidence" },
    { id: "answer",     type: "llm",    label: "Answer",          x: 200, y: 470, description: "LLM: answer from the routed evidence" },
    { id: "end",        type: "end",    label: "END",             x: 200, y: 580 },
  ],
  edges: [
    { id: "e1", source: "start",      target: "retrieve" },
    { id: "e2", source: "retrieve",   target: "grade" },
    { id: "e3", source: "grade",      target: "route" },
    { id: "e4", source: "route",      target: "answer",     label: "use_retrieved",     conditional: true },
    { id: "e5", source: "route",      target: "web_search", label: "use_web / use_mixed", conditional: true },
    { id: "e6", source: "web_search", target: "answer" },
    { id: "e7", source: "answer",     target: "end" },
  ],
  demoInput: "(1) What propellant does the Phoenix-2 engine use?  (2) Population of Iceland in 2024?  (3) Compare Stardust 9 payload to Falcon 9.",
  demoOutput: "(1) grades 1/0/2 → use_mixed → \"methalox (liquid methane + liquid oxygen)\"  ✓\n(2) grades 0/0/3 → use_web → \"I don't have enough information.\"  — fallback fired, but the web snippet didn't contain the figure\n(3) grades 2/0/1 → use_retrieved → \"I don't have enough information.\"  — the corpus has no Falcon 9 data; routing on doc relevance missed that half the question was out-of-corpus",
  executionTrace: [
    { activeNodeId: "retrieve", label: "Retrieve", stateSnapshot: { question: "What propellant does the Phoenix-2 engine use?", n_retrieved: 3 }, explanation: "Standard top-3 vector search." },
    { activeNodeId: "grade",    label: "Grade", stateSnapshot: { grades: ["relevant", "irrelevant", "irrelevant"] }, explanation: "Each doc gets a categorical label with a one-sentence rationale." },
    { activeNodeId: "route",    label: "Route", stateSnapshot: { relevance_fraction: 0.33, route: "use_mixed" }, explanation: "1 of 3 relevant is below the 0.5 threshold but not all irrelevant → mix internal docs with web results." },
    { activeNodeId: "web_search", label: "Web fallback", stateSnapshot: { n_web: 1 }, explanation: "One web snippet is added to the evidence." },
    { activeNodeId: "answer",   label: "Answer", stateSnapshot: { final_answer: "The Phoenix-2 engine uses methalox propellant…" }, explanation: "Generated from the relevant doc plus web context." },
  ],
  codeSnippets: {
    grade: `class _DocGrade(BaseModel):
    relevance: Literal["relevant", "ambiguous", "irrelevant"]
    rationale: str`,
    route: `def _route(self, state):
    grades = state["doc_grades"]
    n = len(grades)
    relevant   = sum(g["relevance"] == "relevant"   for g in grades)
    irrelevant = sum(g["relevance"] == "irrelevant" for g in grades)
    if n == 0 or irrelevant == n:
        route = "use_web"
    elif relevant / n >= self.relevance_threshold:
        route = "use_retrieved"
    else:
        route = "use_mixed"
    return {"route": route}`,
    web_search: `def _web_search(self, state):
    if not self.web_search_fn:
        return {"web_docs": []}
    try:
        docs = self.web_search_fn(state["task"])
    except Exception as e:
        docs = [f"(web search failed: {e})"]
    return {"web_docs": docs}`,
  },
};
