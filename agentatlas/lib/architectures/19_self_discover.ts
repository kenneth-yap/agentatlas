import { Architecture } from "../types";

export const selfDiscover: Architecture = {
  id: "self-discover",
  number: 19,
  name: "Self-Discover",
  part: 3,
  tagline: "Compose a custom reasoning recipe, then follow it",
  controlFlow: "linear",
  loopType: "none",
  memoryType: "none",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "4",
  keyDifferentiator: "The agent designs its own reasoning structure before solving: it SELECTs atomic reasoning modules from a library, ADAPTs them to the task, IMPLEMENTs them as a step plan, then SOLVEs by following the plan.",
  color: "#f59e0b",
  paradigm: "deliberative",
  conceptualInsight: "Separates 'how should I think about this?' from 'what is the answer?'. Planning (#04) plans actions; Self-Discover plans the reasoning process itself — a meta-level plan built from reusable thinking moves.",
  a1a5Profile: {
    a1input: "Reasoning task (e.g. ordering five people from relational height constraints)",
    a2decision: "Four structured-output LLM calls: categorical module selection → rephrasing → step plan → execution",
    a3memory: "Static library of 16 atomic reasoning modules (e.g. 'List the relevant facts, constraints, and unknowns')",
    a4coordination: "None — fixed 4-stage pipeline",
    a5output: "Final answer plus the discovered reasoning plan (auditable)",
  },
  whenToUse: [
    { useCase: "Logic and constraint puzzles", reason: "Forces the model to list constraints and check consistency instead of guessing." },
    { useCase: "Tasks where chain-of-thought wanders", reason: "An explicit plan keeps the reasoning on a structured path." },
    { useCase: "Cheaper alternative to sampling methods", reason: "One structured pass instead of N sampled chains (Self-Consistency)." },
  ],
  strengths: [
    "Fixed, predictable 4-call cost",
    "The reasoning plan is visible and inspectable",
    "No LLM-as-scorer step to calibrate",
    "Module library is customisable per domain",
  ],
  weaknesses: [
    "A bad plan in stage 3 dooms stage 4 — no feedback loop",
    "Overhead is wasted on easy questions",
    "Quality depends on the module library's coverage",
  ],
  comparedTo: [
    { name: "Planning", insight: "Planning decomposes the task into actions. Self-Discover decomposes the reasoning into thinking moves." },
    { name: "Tree of Thoughts", insight: "ToT explores many candidate steps and prunes. Self-Discover commits to a single plan up front." },
  ],
  references: [
    { kind: "origin", authors: "Zhou et al.", year: 2024, title: "Self-Discover: Large Language Models Self-Compose Reasoning Structures", venue: "NeurIPS 2024", url: "https://arxiv.org/abs/2402.03620", note: "Same SELECT → ADAPT → IMPLEMENT stages. The paper discovers one structure per task type and reuses it; this notebook runs discovery for each task." },
  ],
  nodes: [
    { id: "start",     type: "start", label: "START",       x: 200, y: 20 },
    { id: "select",    type: "llm",   label: "SELECT\nmodules", x: 200, y: 130, description: "LLM: picks 3–6 module indices from the 16-module library" },
    { id: "adapt",     type: "llm",   label: "ADAPT\nto task",  x: 200, y: 250, description: "LLM: rephrases each selected module in task-specific words" },
    { id: "implement", type: "llm",   label: "IMPLEMENT\nplan", x: 200, y: 370, description: "LLM: turns adapted modules into numbered steps with expected outputs" },
    { id: "solve",     type: "llm",   label: "SOLVE",           x: 200, y: 490, description: "LLM: executes the plan step by step and emits the final answer" },
    { id: "end",       type: "end",   label: "END",             x: 200, y: 600 },
  ],
  edges: [
    { id: "e1", source: "start",     target: "select" },
    { id: "e2", source: "select",    target: "adapt" },
    { id: "e3", source: "adapt",     target: "implement" },
    { id: "e4", source: "implement", target: "solve" },
    { id: "e5", source: "solve",     target: "end" },
  ],
  demoInput: "Five musicians line up by height. Bea is shorter than Cal but taller than Alex. Dee is taller than Cal. Ed is the shortest. List them TALLEST to SHORTEST.",
  demoOutput: "Dee, Cal, Bea, Alex, Ed  ✓ (matches expected)\n\nSelected modules: [1, 4, 7, 9, 14] — break into sub-problems, list facts & constraints, step-by-step reasoning, make a table, check consistency.\nPlan: 4 steps.",
  executionTrace: [
    { activeNodeId: "select",    label: "Stage 1 — SELECT", stateSnapshot: { selected_ids: [1, 4, 7, 9, 14], rationale: "Ordering puzzle needs constraint listing and a consistency check" }, explanation: "A categorical multi-pick from the module library — not a score. Five modules chosen." },
    { activeNodeId: "adapt",     label: "Stage 2 — ADAPT", stateSnapshot: { adapted: ["List all height facts (Bea<Cal, Dee>Cal, Ed shortest)…", "Check the final order satisfies every height constraint"] }, explanation: "Generic modules become task-specific instructions mentioning the musicians by name." },
    { activeNodeId: "implement", label: "Stage 3 — IMPLEMENT", stateSnapshot: { steps: 4, final_answer_format: "comma-separated list, tallest to shortest" }, explanation: "The adapted modules become a concrete 4-step plan with an expected output for each step." },
    { activeNodeId: "solve",     label: "Stage 4 — SOLVE", stateSnapshot: { final_answer: "Dee, Cal, Bea, Alex, Ed" }, explanation: "The solver follows the plan, recording one output per step, and emits the answer in the requested format." },
  ],
  codeSnippets: {
    select: `class _SelectedModules(BaseModel):
    selected_ids: list[int] = Field(min_length=2, max_length=8)  # indices into MODULE_LIBRARY
    rationale: str

def _select(self, state):
    library = "\\n".join(f"[{i}] {m}" for i, m in enumerate(self.modules))
    r = self._selector.invoke(f"Task:\\n{state['task']}\\n\\nModules:\\n{library}")
    return {"selected_modules": [self.modules[i] for i in r.selected_ids]}`,
    adapt: `class _AdaptedModule(BaseModel):
    original: str
    adapted: str   # replace generic words with concrete nouns from the task`,
    implement: `class _PlanStep(BaseModel):
    step_number: int
    description: str       # which adapted module(s) this step uses
    expected_output: str

class _ReasoningPlan(BaseModel):
    steps: list[_PlanStep] = Field(min_length=2, max_length=8)
    final_answer_format: str`,
    solve: `class _Solution(BaseModel):
    step_outputs: list[str]   # one per plan step
    final_answer: str         # JUST the answer, in the requested format`,
  },
};
