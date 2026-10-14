import { Architecture } from "../types";

export const adaptiveRag: Architecture = {
  id: "adaptive-rag",
  number: 26,
  name: "Adaptive RAG",
  part: 6,
  tagline: "Classify query complexity, then pick no / single / multi-step retrieval",
  controlFlow: "conditional",
  loopType: "none",
  memoryType: "vector",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "1 classify + 1–3 (by route)",
  keyDifferentiator: "One upfront classifier call routes each query to a strategy: no_retrieval (parametric), single_step (plain RAG) or multi_step (retrieve, write a follow-up query, retrieve again). Cost scales with question difficulty.",
  color: "#0ea5e9",
  paradigm: "hybrid",
  conceptualInsight: "Query planning for RAG: a database optimiser picks an index scan or a join plan based on the query; Adaptive RAG picks a retrieval plan based on question complexity — and doesn't pay for the expensive plan on easy queries.",
  a1a5Profile: {
    a1input: "User question; vector corpus",
    a2decision: "LLM classifier → categorical complexity bucket; Python dispatches to one of three strategy nodes",
    a3memory: "FAISS corpus",
    a4coordination: "Router → one of three strategy branches",
    a5output: "Answer plus the route taken and retrieval count",
  },
  whenToUse: [
    { useCase: "High-volume Q&A with mixed difficulty", reason: "Easy questions skip retrieval entirely, cutting average cost." },
    { useCase: "Multi-hop questions", reason: "The multi-step path writes a follow-up query to fill the gap the first retrieval left." },
    { useCase: "Predictable latency budgets", reason: "Each route has a fixed, known cost — unlike an open-ended agent loop." },
  ],
  strengths: [
    "Pays for retrieval only when needed",
    "Single categorical decision — easy to log and evaluate",
    "Each strategy is simple and testable on its own",
    "Bounded cost per route",
  ],
  weaknesses: [
    "A misclassification can't be corrected later in the run",
    "Multi-step is fixed at two retrievals here",
    "The paper trains a small classifier; using the LLM as classifier adds a call",
  ],
  comparedTo: [
    { name: "Meta-Controller", insight: "Same pre-routing pattern, but routing between retrieval strategies rather than specialist agents." },
    { name: "Agentic RAG", insight: "Adaptive RAG decides once, up front. Agentic RAG re-decides after every retrieval." },
  ],
  references: [
    { kind: "origin", authors: "Jeong et al.", year: 2024, title: "Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity", venue: "NAACL 2024", url: "https://arxiv.org/abs/2403.14403", note: "The paper trains a small classifier LM on automatically labelled complexity; this notebook prompts the main LLM to classify." },
    { kind: "related", authors: "Jacobs, Jordan, Nowlan & Hinton", year: 1991, title: "Adaptive Mixtures of Local Experts", venue: "Neural Computation 3(1)", url: "https://doi.org/10.1162/neco.1991.3.1.79", note: "The gating idea behind any pre-router: send each input to the cheapest expert that can handle it." },
  ],
  nodes: [
    { id: "start",        type: "start",      label: "START",            x: 250, y: 20 },
    { id: "classify",     type: "controller", label: "Classify\nComplexity", x: 250, y: 150, description: "LLM: no_retrieval | single_step | multi_step + rationale" },
    { id: "no_retrieval", type: "llm",        label: "No\nRetrieval",     x: 80,  y: 320, description: "LLM: answer from parametric knowledge" },
    { id: "single_step",  type: "memory",     label: "Single-Step\nRAG",  x: 250, y: 320, description: "Memory + LLM: one retrieval, one answer" },
    { id: "multi_step",   type: "memory",     label: "Multi-Step\nRAG",   x: 420, y: 320, description: "Memory + LLM: retrieve → write follow-up query → retrieve → answer from both" },
    { id: "end",          type: "end",        label: "END",              x: 250, y: 480 },
  ],
  edges: [
    { id: "e1", source: "start",        target: "classify" },
    { id: "e2", source: "classify",     target: "no_retrieval", label: "no_retrieval", conditional: true },
    { id: "e3", source: "classify",     target: "single_step",  label: "single_step",  conditional: true },
    { id: "e4", source: "classify",     target: "multi_step",   label: "multi_step",   conditional: true },
    { id: "e5", source: "no_retrieval", target: "end" },
    { id: "e6", source: "single_step",  target: "end" },
    { id: "e7", source: "multi_step",   target: "end" },
  ],
  demoInput: "(1) What is 15 plus 27?  (2) What propellant does the Stardust 9 use?  (3) Who founded Stardust Aerospace, and what did the CEO do before?",
  demoOutput: "(1) → no_retrieval, 0 retrievals → \"42\"\n(2) → single_step, 1 retrieval → \"Methalox (liquid methane + liquid oxygen)\"\n(3) → multi_step, 2 retrievals → \"Founded by Dr. Amara Okonkwo and Jin-ho Park in 2019. Before that, the CEO worked at Blue Origin on the New Glenn program…\"\n\nAll three routed as intended.",
  executionTrace: [
    { activeNodeId: "classify",    label: "Classify", stateSnapshot: { question: "Who founded Stardust Aerospace, and what did the CEO do before?", complexity: "multi_step", rationale: "Needs the founders and the CEO's prior experience" }, explanation: "A single categorical classification decides the whole strategy." },
    { activeNodeId: "multi_step",  label: "Multi-step: hop 1", stateSnapshot: { query_1: "Who founded Stardust Aerospace…", docs: 3 }, explanation: "The first retrieval uses the raw question." },
    { activeNodeId: "multi_step",  label: "Multi-step: hop 2", stateSnapshot: { followup_query: "(illustrative) Amara Okonkwo career before Stardust", docs: 3 }, explanation: "The LLM writes ONE follow-up query targeting what's still missing, then answers from both contexts. The recorded run's answer named the CEO's prior role at Blue Origin." },
    { activeNodeId: "no_retrieval", label: "Contrast: '15 plus 27'", stateSnapshot: { complexity: "no_retrieval", retrieval_count: 0, final_answer: "42" }, explanation: "The same router sends arithmetic straight to the LLM — zero retrieval cost." },
  ],
  codeSnippets: {
    classify: `class _ComplexityClass(BaseModel):
    complexity: Literal["no_retrieval", "single_step", "multi_step"]
    rationale: str

def _route(self, state):
    return state["complexity"]   # categorical → node name`,
    multi_step: `def _multi_step_rag(self, state):
    first = self.memory.search(state["task"], k=self.top_k)
    followup = self.llm.invoke(
        f"You retrieved:\\n{fmt(first)}\\nWhat ONE additional search query "
        "would best fill the remaining information gap?").content
    second = self.memory.search(followup, k=self.top_k)
    answer = self.llm.invoke(
        f"Answer using BOTH contexts.\\n{fmt(first)}\\n{fmt(second)}\\n"
        f"Question: {state['task']}").content
    return {"final_answer": answer}`,
  },
};
