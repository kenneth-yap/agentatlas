import { Architecture } from "../types";

export const selfRag: Architecture = {
  id: "self-rag",
  number: 25,
  name: "Self-RAG",
  part: 6,
  tagline: "Retrieve on demand; tag each doc with reflection tokens; keep only the good ones",
  controlFlow: "conditional",
  loopType: "none",
  memoryType: "vector",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "1 decide + k reflect + 1 answer (or 2 if no retrieval)",
  keyDifferentiator: "Two self-checks: first 'do I need retrieval at all?', then per-document reflection tokens (is_relevant, is_supported, is_useful), each a 3-way categorical. Python keeps a doc only if it is relevant AND supported.",
  color: "#0ea5e9",
  paradigm: "hybrid",
  conceptualInsight: "Reflection tokens are structured metadata attached to each retrieved document — like quality flags on rows in a data pipeline. Filtering on them before generation is a WHERE clause over your context window.",
  a1a5Profile: {
    a1input: "User question; vector corpus",
    a2decision: "LLM: needs_retrieval bool; per-doc categorical reflection tokens; Python keep/drop rule",
    a3memory: "FAISS corpus; reflection tokens per retrieved doc in state",
    a4coordination: "None — conditional pipeline",
    a5output: "Answer generated from kept docs only (or parametric knowledge if retrieval skipped)",
  },
  whenToUse: [
    { useCase: "Noisy corpora", reason: "Per-doc filtering removes partially relevant chunks that would distract the generator." },
    { useCase: "Mixed parametric / corpus questions", reason: "The retrieval decision skips search for '25 squared'." },
    { useCase: "Citation-sensitive answers", reason: "is_supported marks which docs actually back the answer." },
  ],
  strengths: [
    "Skips retrieval when unnecessary",
    "Fine-grained, per-document filtering",
    "All judgements categorical; keep rule is transparent Python",
    "Token log explains why each doc was dropped",
  ],
  weaknesses: [
    "k extra LLM calls for reflection",
    "May drop every doc and answer with no evidence",
    "The paper trains the model to emit tokens; prompting approximates it",
  ],
  comparedTo: [
    { name: "Corrective RAG", insight: "CRAG uses doc grades to choose an evidence source (corpus vs web). Self-RAG uses them to filter which docs reach the generator." },
    { name: "Adaptive RAG", insight: "Both can skip retrieval. Adaptive RAG classifies query complexity into 3 strategies; Self-RAG makes a yes/no retrieval call, then filters." },
  ],
  references: [
    { kind: "origin", authors: "Asai et al.", year: 2024, title: "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection", venue: "ICLR 2024", url: "https://arxiv.org/abs/2310.11511", note: "The paper fine-tunes a model to emit special reflection tokens during decoding. This notebook prompts a general model for the same labels via structured output — no training." },
  ],
  nodes: [
    { id: "start",            type: "start",  label: "START",            x: 200, y: 20 },
    { id: "decide_retrieval", type: "llm",    label: "Need\nRetrieval?",  x: 200, y: 120, description: "LLM: needs_retrieval bool + rationale" },
    { id: "retrieve",         type: "memory", label: "Retrieve",          x: 400, y: 210, description: "Memory: FAISS top-k (default 4)" },
    { id: "reflect",          type: "llm",    label: "Reflection\nTokens", x: 400, y: 320, description: "LLM ×k: is_relevant / is_supported / is_useful (each 3-way)" },
    { id: "compose_keep",     type: "rule",   label: "Keep /\nDrop",     x: 400, y: 430, description: "Rule: keep iff relevant ≠ not_relevant AND supported ≠ no_support" },
    { id: "answer",           type: "llm",    label: "Answer",           x: 200, y: 500, description: "LLM: answer from kept docs (or parametric knowledge)" },
    { id: "end",              type: "end",    label: "END",              x: 200, y: 610 },
  ],
  edges: [
    { id: "e1", source: "start",            target: "decide_retrieval" },
    { id: "e2", source: "decide_retrieval", target: "retrieve",     label: "yes", conditional: true },
    { id: "e3", source: "decide_retrieval", target: "answer",       label: "no",  conditional: true },
    { id: "e4", source: "retrieve",         target: "reflect" },
    { id: "e5", source: "reflect",          target: "compose_keep" },
    { id: "e6", source: "compose_keep",     target: "answer" },
    { id: "e7", source: "answer",           target: "end" },
  ],
  demoInput: "When was Stardust Aerospace founded and by whom?  (+ 'What is 25 squared?')",
  demoOutput: "Retrieved 4, kept 1:\n  doc[0] fully_relevant / fully_supported / very_useful   → keep\n  doc[1] partially_relevant / no_support / somewhat_useful → drop\n  doc[2–3] not_relevant / no_support / not_useful        → drop\n→ \"Stardust Aerospace was founded in 2019 by Dr. Amara Okonkwo and Jin-ho Park.\"\n\n'25 squared' → needs_retrieval=false → \"625\" (0 docs retrieved)",
  executionTrace: [
    { activeNodeId: "decide_retrieval", label: "Decide", stateSnapshot: { needs_retrieval: true, rationale: "Company-specific founding facts" }, explanation: "A boolean check before any search. For '25 squared' this returns false and jumps straight to Answer." },
    { activeNodeId: "retrieve",         label: "Retrieve", stateSnapshot: { n_retrieved: 4 }, explanation: "Top-4 chunks from the vector store." },
    { activeNodeId: "reflect",          label: "Reflect per doc", stateSnapshot: { "doc[0]": "fully_relevant / fully_supported / very_useful", "doc[1]": "partially_relevant / no_support / somewhat_useful" }, explanation: "Three categorical tokens per document — never a numeric score." },
    { activeNodeId: "compose_keep",     label: "Keep / drop", stateSnapshot: { kept_doc_indices: [0], dropped: [1, 2, 3] }, explanation: "doc[1] is partly relevant but has no support, so the AND rule drops it." },
    { activeNodeId: "answer",           label: "Answer", stateSnapshot: { final_answer: "Founded in 2019 by Dr. Amara Okonkwo and Jin-ho Park." }, explanation: "Generated from the single kept document." },
  ],
  codeSnippets: {
    decide_retrieval: `class _RetrieveDecision(BaseModel):
    needs_retrieval: bool
    rationale: str`,
    reflect: `class _ReflectionTokens(BaseModel):
    is_relevant:  Literal["fully_relevant", "partially_relevant", "not_relevant"]
    is_supported: Literal["fully_supported", "partially_supported", "no_support"]
    is_useful:    Literal["very_useful", "somewhat_useful", "not_useful"]
    rationale: str`,
    compose_keep: `def _compose_keep(self, state):
    kept = [i for i, t in enumerate(state["reflection_tokens"])
            if t["is_relevant"] != "not_relevant"
            and t["is_supported"] != "no_support"]
    return {"kept_doc_indices": kept}`,
  },
};
