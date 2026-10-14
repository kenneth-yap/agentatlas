import { Architecture } from "../types";

export const agenticRag: Architecture = {
  id: "agentic-rag",
  number: 23,
  name: "Agentic RAG",
  part: 6,
  tagline: "The agent decides when — and what — to retrieve",
  controlFlow: "conditional",
  loopType: "reactive",
  memoryType: "vector",
  toolUse: true,
  llmDriven: true,
  llmCallsPerTask: "1 per decide step (≤ max_iterations, default 4)",
  keyDifferentiator: "Plain RAG always retrieves once, then answers. Agentic RAG makes retrieval a tool: each turn the LLM chooses a categorical action — retrieve (with a query it writes) or answer — so it can skip retrieval or search several times.",
  color: "#0ea5e9",
  paradigm: "reactive",
  conceptualInsight: "RAG viewed as ReAct with exactly one tool. Moving the 'should I retrieve?' decision from code into the model trades predictability for flexibility — the same trade-off as Planning vs ReAct.",
  a1a5Profile: {
    a1input: "User question; a 12-document vector corpus (fictional 'Stardust Aerospace')",
    a2decision: "LLM structured output: action ∈ {retrieve, answer} + query + rationale",
    a3memory: "FAISS vector store over the corpus; retrieved chunks accumulate in state",
    a4coordination: "None — single agent loop: decide → retrieve → decide …",
    a5output: "Final answer plus the list of queries issued",
  },
  whenToUse: [
    { useCase: "Mixed workloads (some questions need docs, some don't)", reason: "The agent skips retrieval for arithmetic or general knowledge." },
    { useCase: "Questions needing follow-up searches", reason: "The agent can rewrite its query after seeing the first results." },
    { useCase: "Chat assistants over a knowledge base", reason: "Retrieval becomes one tool among others the agent already uses." },
  ],
  strengths: [
    "Skips unnecessary retrieval",
    "Agent writes focused queries rather than embedding the raw question",
    "Can retrieve multiple times",
    "Simple: one tool, one categorical decision",
  ],
  weaknesses: [
    "The agent can make poor retrieval decisions (the demo retrieved twice for 'capital of France')",
    "Variable latency and cost",
    "No check that retrieved docs are relevant",
    "Multi-part questions may be answered partially",
  ],
  comparedTo: [
    { name: "Adaptive RAG", insight: "Adaptive RAG picks a strategy once up front with a classifier. Agentic RAG decides every turn." },
    { name: "Corrective RAG", insight: "Agentic RAG decides whether to retrieve. CRAG checks whether what was retrieved is any good." },
    { name: "ReAct", insight: "Same Thought → Action → Observation loop, specialised to a single retrieval tool." },
  ],
  references: [
    { kind: "background", authors: "Lewis et al.", year: 2020, title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", venue: "NeurIPS 2020", url: "https://arxiv.org/abs/2005.11401", note: "The original RAG: a retriever over a dense index feeding a generator. Here retrieval becomes a decision the agent makes." },
    { kind: "related", authors: "Yao et al.", year: 2023, title: "ReAct: Synergizing Reasoning and Acting in Language Models", venue: "ICLR 2023", url: "https://arxiv.org/abs/2210.03629", note: "Agentic RAG is a ReAct loop with one retrieval tool." },
    { kind: "implementation", authors: "LangChain", title: "Agentic RAG (LangGraph tutorial)", venue: "LangGraph documentation", url: "https://docs.langchain.com/oss/python/langgraph/agentic-rag" },
  ],
  nodes: [
    { id: "start",    type: "start",  label: "START",          x: 200, y: 20 },
    { id: "decide",   type: "llm",    label: "Decide:\nretrieve or answer?", x: 200, y: 170, description: "LLM: categorical action + query + rationale" },
    { id: "retrieve", type: "memory", label: "Vector\nRetrieve", x: 440, y: 170, description: "Memory: FAISS top-k search with the agent's query" },
    { id: "answer",   type: "llm",    label: "Answer",          x: 200, y: 340, description: "LLM: final answer from accumulated context" },
    { id: "end",      type: "end",    label: "END",             x: 200, y: 470 },
  ],
  edges: [
    { id: "e1", source: "start",    target: "decide" },
    { id: "e2", source: "decide",   target: "retrieve", label: "retrieve", conditional: true },
    { id: "e3", source: "retrieve", target: "decide",   label: "observe" },
    { id: "e4", source: "decide",   target: "answer",   label: "answer",   conditional: true },
    { id: "e5", source: "answer",   target: "end" },
  ],
  demoInput: "What is the maximum payload to LEO of the Stardust 9 rocket?  (+ 3 more: 17×6, the CTO's previous role, capital of France)",
  demoOutput: "Payload: 1 retrieval → \"1,850 kg\"\n17 × 6: 0 retrievals → \"102\"  ✓ skipped retrieval\nCTO + previous role: 1 retrieval → \"Jin-ho Park\"  ✗ only half answered\nCapital of France: 2 retrievals → \"Paris\"  ✗ retrieved unnecessarily (twice)",
  executionTrace: [
    { activeNodeId: "decide",   label: "Turn 1 — Decide", stateSnapshot: { action: "retrieve", query: "Stardust 9 rocket maximum payload to LEO", rationale: "Company-specific fact not in my knowledge" }, explanation: "The agent recognises a fictional, corpus-only fact and writes a focused query." },
    { activeNodeId: "retrieve", label: "Retrieve", stateSnapshot: { retrieval_count: 1, top_k: 3, hit: "…payload of 1,850 kg to low earth orbit (LEO) or 720 kg to geosynchronous…" }, explanation: "FAISS returns the 3 nearest chunks; they're appended to the agent's context." },
    { activeNodeId: "decide",   label: "Turn 2 — Decide", stateSnapshot: { action: "answer" }, explanation: "With the payload figure in context, the agent chooses to answer." },
    { activeNodeId: "answer",   label: "Answer", stateSnapshot: { final_answer: "1,850 kg", iterations_used: 2 }, explanation: "For '17 × 6' the very first decision is 'answer' — no retrieval cost at all." },
  ],
  codeSnippets: {
    decide: `class _AgentDecision(BaseModel):
    action: Literal["retrieve", "answer"]
    query: str = ""    # if action == 'retrieve'
    answer: str = ""   # if action == 'answer'
    rationale: str

def _route_decision(self, state):
    action = state["last_decision"].get("action", "answer")
    if action == "retrieve" and state["iteration"] < state["max_iterations"]:
        return "retrieve"
    return "answer"   # also forced once the iteration cap is hit`,
    retrieve: `def _retrieve(self, state):
    query = state["last_decision"]["query"]
    docs = self.memory.search(query, k=self.top_k)
    return {"retrievals": [{"query": query,
                            "docs": [d.page_content for d in docs]}]}`,
  },
};
