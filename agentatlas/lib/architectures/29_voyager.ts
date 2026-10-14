import { Architecture } from "../types";

export const voyager: Architecture = {
  id: "voyager",
  number: 29,
  name: "Voyager (Skill Library)",
  part: 5,
  tagline: "Write code skills once, retrieve and reuse them forever",
  controlFlow: "conditional",
  loopType: "none",
  memoryType: "vector",
  toolUse: true,
  llmDriven: true,
  llmCallsPerTask: "2–3 (decide + apply, + write if new)",
  keyDifferentiator: "Memory stores executable code, not text. Each task first retrieves the closest skill from a vector-indexed library; the LLM decides reuse vs write_new; the skill is then actually executed in a sandboxed Python subprocess.",
  color: "#8b5cf6",
  paradigm: "learning",
  conceptualInsight: "The agent builds its own function library — procedural memory. Executing the code (instead of trusting the LLM's predicted output) turns a language model into a program synthesiser whose outputs are verified by an interpreter.",
  a1a5Profile: {
    a1input: "Small computational task (e.g. 'Compute the factorial of 7')",
    a2decision: "Vector retrieval of the best skill → LLM reuse/write_new decision → LLM writes an invocation",
    a3memory: "Skill library: {name, description, code} indexed by description embedding; persists across run() calls",
    a4coordination: "None — single agent",
    a5output: "Real subprocess stdout (not the LLM's guess) plus an updated skill library",
  },
  whenToUse: [
    { useCase: "Recurring task families", reason: "Factorial(5) teaches a skill that factorial(7) reuses for free." },
    { useCase: "Tasks where exact computation matters", reason: "Executing code avoids LLM arithmetic errors." },
    { useCase: "Long-running agents that should accumulate capability", reason: "The library compounds — later tasks are cheaper." },
  ],
  strengths: [
    "Learns reusable, composable capabilities",
    "Outputs verified by actual execution",
    "Library is plain, inspectable code",
    "Reuse skips code generation",
  ],
  weaknesses: [
    "Running LLM-written code needs sandboxing (subprocess + timeout here)",
    "Retrieval by description can match the wrong skill",
    "Bad skills persist unless pruned",
    "Only fits tasks expressible as functions",
  ],
  comparedTo: [
    { name: "Agent Workflow Memory", insight: "AWM stores natural-language recipes; Voyager stores executable code." },
    { name: "Reflexion", insight: "Reflexion remembers lessons from failures; Voyager remembers working solutions." },
    { name: "Tool Use", insight: "Tool Use calls tools that already exist. Voyager writes new tools for itself." },
  ],
  references: [
    { kind: "origin", authors: "Wang et al.", year: 2023, title: "Voyager: An Open-Ended Embodied Agent with Large Language Models", venue: "arXiv preprint", url: "https://arxiv.org/abs/2305.16291", note: "Keeps the skill-library loop (retrieve → reuse or write → store). Drops Minecraft, the automatic curriculum and iterative self-verification; skills here are small Python functions." },
  ],
  nodes: [
    { id: "start",              type: "start",  label: "START",             x: 250, y: 20 },
    { id: "retrieve_candidate", type: "memory", label: "Retrieve\nSkill",    x: 250, y: 130, description: "Memory: vector search of the skill library by task description" },
    { id: "decide_reuse",       type: "llm",    label: "Reuse or\nWrite New?", x: 250, y: 250, description: "LLM: 'reuse' only if the retrieved skill genuinely solves the task" },
    { id: "apply_existing",     type: "tool",   label: "Apply\nExisting",    x: 80,  y: 400, description: "LLM writes invocation; Tool: run in Python subprocess" },
    { id: "write_new",          type: "llm",    label: "Write\nSkill",       x: 420, y: 370, description: "LLM: function_name, description, code; added to library" },
    { id: "apply_new",          type: "tool",   label: "Apply\nNew",         x: 420, y: 490, description: "Tool: run new skill + invocation in a subprocess (5 s timeout)" },
    { id: "end",                type: "end",    label: "END",               x: 250, y: 600 },
  ],
  edges: [
    { id: "e1", source: "start",              target: "retrieve_candidate" },
    { id: "e2", source: "retrieve_candidate", target: "decide_reuse" },
    { id: "e3", source: "decide_reuse",       target: "apply_existing", label: "reuse",     conditional: true },
    { id: "e4", source: "decide_reuse",       target: "write_new",      label: "write_new", conditional: true },
    { id: "e5", source: "write_new",          target: "apply_new" },
    { id: "e6", source: "apply_existing",     target: "end" },
    { id: "e7", source: "apply_new",          target: "end" },
  ],
  demoInput: "Three tasks in sequence on one agent: factorial of 5 → factorial of 7 → 8th Fibonacci number.",
  demoOutput: "factorial_5: write_new 'factorial' → factorial(5) → 120  ✓  library 0 → 1\nfactorial_7: reuse 'factorial' → factorial(7) → 5040  ✓  library 1 → 1\nfibonacci_8: write_new 'fibonacci' → fibonacci(8) → 21  ✓  library 1 → 2\n\nThe second task reused the skill written by the first — no new code generated.",
  executionTrace: [
    { activeNodeId: "retrieve_candidate", label: "Task 2 — Retrieve", stateSnapshot: { task: "Compute the factorial of 7", library_size: 1, candidate: "factorial" }, explanation: "The library already holds the factorial skill written during task 1." },
    { activeNodeId: "decide_reuse",       label: "Decide", stateSnapshot: { action: "reuse", rationale: "Existing factorial skill solves this directly" }, explanation: "A categorical choice — no new code needed." },
    { activeNodeId: "apply_existing",     label: "Apply", stateSnapshot: { invocation: "factorial(7)", executed_stdout: "5040", llm_predicted: "5040", execution_ok: true }, explanation: "The skill code plus invocation run in a fresh `python -I` subprocess. The real stdout is the answer; the LLM's prediction is kept only for comparison." },
    { activeNodeId: "write_new",          label: "Contrast: Task 3", stateSnapshot: { task: "8th Fibonacci number", action: "write_new" }, explanation: "No suitable skill exists, so a new one is written, executed, and added — growing the library." },
  ],
  codeSnippets: {
    decide_reuse: `class _SkillDecision(BaseModel):
    action: Literal["reuse", "write_new"]
    rationale: str`,
    write_new: `class _NewSkillSpec(BaseModel):
    function_name: str   # snake_case, e.g. 'factorial'
    description: str     # embedded for future retrieval
    code: str            # full def with docstring; stdlib only, no side effects
    example_invocation: str`,
    apply_existing: `def _exec_skill(code, invocation, timeout=5):
    script = f"{code}\\n\\n_result = {invocation}\\nprint(_result)\\n"
    try:
        proc = subprocess.run([sys.executable, "-I", "-c", script],
                              capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return ("", False, f"timeout after {timeout}s")
    if proc.returncode != 0:
        return (proc.stdout.strip(), False, proc.stderr.strip()[:300])
    return (proc.stdout.strip(), True, "")`,
    apply_new: `def _apply_new(self, state):
    skill, invocation = state["skill_used"], state["invocation"]
    stdout, ok, err = _exec_skill(skill["code"], invocation)
    return {"final_answer": stdout if ok else f"(execution failed: {err})"}`,
  },
};
