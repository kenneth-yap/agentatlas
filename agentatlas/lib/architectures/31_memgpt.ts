import { Architecture } from "../types";

export const memgpt: Architecture = {
  id: "memgpt",
  number: 31,
  name: "MemGPT (Tiered Memory)",
  part: 3,
  tagline: "OS-style memory: small context 'RAM', unbounded archival 'disk'",
  controlFlow: "conditional",
  loopType: "reactive",
  memoryType: "tiered",
  toolUse: true,
  llmDriven: true,
  llmCallsPerTask: "1 per action (≤ max_iterations)",
  keyDifferentiator: "The agent manages its own memory with explicit actions — write_to_archival, search_archival, answer. A bounded context tier evicts oldest-first (FIFO); evicted facts survive in the archival vector store and can be paged back in.",
  color: "#f59e0b",
  paradigm: "hybrid",
  conceptualInsight: "Virtual memory for LLMs. The context window is RAM (fast, small); the vector store is disk (slow, unbounded). Like an OS, the system pages data between tiers — except here the LLM itself issues the paging commands.",
  a1a5Profile: {
    a1input: "Conversational turns (facts to remember, questions to answer)",
    a2decision: "LLM picks one action per step; final iteration forces 'answer'",
    a3memory: "Two tiers: context list (limit 3 in demo, FIFO eviction) + FAISS archival store",
    a4coordination: "None — single agent loop: decide → execute → decide …",
    a5output: "Answer plus context/archival sizes before and after",
  },
  whenToUse: [
    { useCase: "Long-running personal assistants", reason: "User facts outlive the context window." },
    { useCase: "Analysing documents larger than the context", reason: "Page relevant sections in, page others out." },
    { useCase: "Cost control on long chats", reason: "Keep the prompt small; retrieve history only when needed." },
  ],
  strengths: [
    "Memory capacity is unbounded",
    "Context size (and cost) stays fixed",
    "Agent decides what is worth remembering",
    "Clear mental model borrowed from operating systems",
  ],
  weaknesses: [
    "The agent may forget to save, or skip searching",
    "FIFO eviction ignores importance",
    "Extra calls for memory management",
    "Recalled facts can duplicate in context (seen in the demo)",
  ],
  comparedTo: [
    { name: "Episodic + Semantic Memory", insight: "#08 writes memory automatically after each turn. MemGPT lets the LLM decide when to read and write." },
    { name: "Agentic RAG", insight: "Agentic RAG can only read from a fixed corpus. MemGPT can also write to its own store." },
  ],
  references: [
    { kind: "origin", authors: "Packer et al.", year: 2023, title: "MemGPT: Towards LLMs as Operating Systems", venue: "arXiv preprint", url: "https://arxiv.org/abs/2310.08560", note: "Keeps the two-tier paging idea. Omits the paper's function-calling plumbing, recall storage and memory-pressure warnings." },
    { kind: "background", authors: "Sumers et al.", year: 2024, title: "Cognitive Architectures for Language Agents (CoALA)", venue: "TMLR", url: "https://arxiv.org/abs/2309.02427", note: "Frames working vs long-term memory for language agents — the two tiers here." },
  ],
  nodes: [
    { id: "start",    type: "start",  label: "START",          x: 200, y: 20 },
    { id: "decide",   type: "llm",    label: "Decide\nAction",  x: 200, y: 160, description: "LLM: write_to_archival | search_archival | answer (forced on last iteration)" },
    { id: "execute",  type: "rule",   label: "Execute",         x: 200, y: 320, description: "Rule: perform the memory operation; answer ends the loop" },
    { id: "context",  type: "memory", label: "Context Tier\n(RAM, FIFO)", x: 440, y: 240, description: "Memory: bounded list; oldest fact evicted when full" },
    { id: "archival", type: "memory", label: "Archival Tier\n(disk)", x: 440, y: 400, description: "Memory: FAISS store; unbounded; searched on demand" },
    { id: "end",      type: "end",    label: "END",             x: 200, y: 480 },
  ],
  edges: [
    { id: "e1", source: "start",    target: "decide" },
    { id: "e2", source: "decide",   target: "execute" },
    { id: "e3", source: "execute",  target: "context",  label: "push / page-in" },
    { id: "e4", source: "execute",  target: "archival", label: "write / search" },
    { id: "e5", source: "execute",  target: "decide",   label: "not answered", conditional: true },
    { id: "e6", source: "execute",  target: "end",      label: "answer",       conditional: true },
  ],
  demoInput: "Turns 1–4: 'Remember this: favourite colour teal / cat named Mochi / I live in Reno / pickleball on Tuesdays'. Turn 5: 'What is my favourite colour?'  (context limit = 3)",
  demoOutput: "Turns 1–3: write_to_archival → context 0→1→2→3\nTurn 4: write (evicts 'teal' from context) + search_archival → context 3→3\nTurn 5: answer → \"teal\"  ✓\n\nNote: turn 4's search happened to page 'teal' back in, so turn 5 answered from context without searching. Final context held a duplicate '[recalled] My favourite colour is teal'.",
  executionTrace: [
    { activeNodeId: "decide",  label: "Turn 1 — Decide", stateSnapshot: { task: "Remember this: My favourite colour is teal.", context: [], action: "write_to_archival" }, explanation: "The agent chooses to persist the fact." },
    { activeNodeId: "archival", label: "Turn 1 — Write", stateSnapshot: { archival: 1, context: ["My favourite colour is teal"] }, explanation: "The fact goes to the archival store and into the context tier." },
    { activeNodeId: "context",  label: "Turn 4 — Eviction", stateSnapshot: { context_limit: 3, evicted: "My favourite colour is teal", context: ["cat named Mochi", "I live in Reno", "pickleball on Tuesdays"] }, explanation: "A 4th fact overflows the 3-slot context, so the oldest is evicted (FIFO). It still exists on 'disk'." },
    { activeNodeId: "execute",  label: "Turn 4 — Search", stateSnapshot: { action: "search_archival", n_hits: 3 }, explanation: "Search hits are pushed into context as '[recalled] …' — which brings 'teal' back in." },
    { activeNodeId: "decide",   label: "Turn 5 — Answer", stateSnapshot: { task: "What is my favourite colour?", action: "answer", final_answer: "teal" }, explanation: "The fact is in context, so the agent answers directly." },
  ],
  codeSnippets: {
    decide: `class _MemAction(BaseModel):
    action: Literal["write_to_archival", "search_archival", "answer"]
    payload: str = ""   # fact text | search query | final answer
    rationale: str`,
    execute: `def _execute_action(self, state):
    kind, payload = state["last_action"]["action"], state["last_action"]["payload"]
    if kind == "write_to_archival":
        self.archival.add([Document(page_content=payload)])
        self._push_context(payload)
    elif kind == "search_archival":
        for d in self.archival.search(payload, k=3):
            self._push_context(f"[recalled] {d.page_content[:200]}")
    elif kind == "answer":
        return {"final_answer": payload}`,
    context: `def _push_context(self, fact):
    """Add to context tier; FIFO-evict if over capacity."""
    self.context_tier.append(fact)
    while len(self.context_tier) > self.context_limit:
        self.context_tier.pop(0)   # evicted from RAM, still on 'disk'`,
  },
};
