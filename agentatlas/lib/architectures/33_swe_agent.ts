import { Architecture } from "../types";

export const sweAgent: Architecture = {
  id: "swe-agent",
  number: 33,
  name: "SWE-Agent",
  part: 1,
  tagline: "Read, edit and test code through a sandboxed file-system interface",
  controlFlow: "conditional",
  loopType: "reactive",
  memoryType: "message_history",
  toolUse: true,
  llmDriven: true,
  llmCallsPerTask: "1 per action (demo: 6)",
  keyDifferentiator: "The tools are designed for an LLM user: four narrow commands (list_files, read_file, write_file, run_check), with every path confined to a working directory. 'run_check' gives ground-truth feedback by actually executing the code.",
  color: "#6366f1",
  paradigm: "reactive",
  conceptualInsight: "The paper's thesis: agent performance depends on the agent–computer interface as much as on the model — just as developers depend on their IDE. A small, safe, well-documented tool surface beats giving the model a raw shell.",
  a1a5Profile: {
    a1input: "Bug report and a sandbox directory containing the buggy file",
    a2decision: "LLM picks one action per step: list_files | read_file | write_file | run_check | answer",
    a3memory: "Observation log (tool outputs) carried in state",
    a4coordination: "None — single-agent decide → execute loop",
    a5output: "Fixed file on disk, passing checks, and a summary of the bug",
  },
  whenToUse: [
    { useCase: "Bug fixing with a test to verify", reason: "run_check closes the loop with real execution, not LLM opinion." },
    { useCase: "Code maintenance in a contained repo", reason: "Path sandboxing limits blast radius." },
    { useCase: "Teaching agent tool design", reason: "Shows how a narrow interface shapes behaviour." },
  ],
  strengths: [
    "Grounded in real execution results",
    "Sandboxed paths (no absolute paths or '..' escapes)",
    "Simple, auditable action log",
    "Generalises to any file-based task",
  ],
  weaknesses: [
    "Whole-file writes (no line-level edit tool) — demo wrote the file twice",
    "No real isolation beyond path checks; production needs a container",
    "Long files strain the context window",
    "Quality depends on the checks provided",
  ],
  comparedTo: [
    { name: "ReAct", insight: "Same reason-act loop; SWE-Agent's contribution is the tool interface design." },
    { name: "Voyager", insight: "Voyager writes new functions from scratch; SWE-Agent edits existing files and verifies them." },
  ],
  references: [
    { kind: "origin", authors: "Yang et al.", year: 2024, title: "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering", venue: "arXiv preprint", url: "https://arxiv.org/abs/2405.15793", note: "The paper's ACI includes search, a windowed file viewer and line-range edits with linting. This notebook keeps four basic tools to show the loop." },
    { kind: "related", authors: "Yao et al.", year: 2023, title: "ReAct: Synergizing Reasoning and Acting in Language Models", venue: "ICLR 2023", url: "https://arxiv.org/abs/2210.03629" },
  ],
  nodes: [
    { id: "start",   type: "start", label: "START",          x: 200, y: 20 },
    { id: "decide",  type: "llm",   label: "Decide\nAction",  x: 200, y: 160, description: "LLM: one of list_files, read_file, write_file, run_check, answer" },
    { id: "execute", type: "tool",  label: "Sandboxed\nFS Tools", x: 200, y: 320, description: "Tool: path-checked file ops; run_check executes the file in a subprocess" },
    { id: "end",     type: "end",   label: "END",            x: 200, y: 470 },
  ],
  edges: [
    { id: "e1", source: "start",   target: "decide" },
    { id: "e2", source: "decide",  target: "execute" },
    { id: "e3", source: "execute", target: "decide", label: "observation",     conditional: true },
    { id: "e4", source: "execute", target: "end",    label: "action = answer", conditional: true },
  ],
  demoInput: "factorial.py has a bug (its tests fail). Read it, fix it, run_check to confirm, and report the bug.",
  demoOutput: "Actions: read_file → write_file → write_file → read_file → run_check (rc=0) → answer\n\n\"The bug was a missing base case for n=0, causing infinite recursion. Fixed by returning 1 when n == 0.\"\n\nFixed file passes both asserts.",
  executionTrace: [
    { activeNodeId: "decide",  label: "Step 1 — read_file", stateSnapshot: { action: "read_file", path: "factorial.py" }, explanation: "Start by reading the suspect file." },
    { activeNodeId: "execute", label: "Observation", stateSnapshot: { observation: "def factorial(n):\n    # BUG: missing base case for n=0\n    return n * factorial(n - 1)" }, explanation: "The file contents come back as an observation." },
    { activeNodeId: "decide",  label: "Steps 2–3 — write_file ×2", stateSnapshot: { action: "write_file", bytes: [284, 256] }, explanation: "The agent rewrites the whole file — twice. A line-edit tool (as in the paper) would make edits cheaper and safer." },
    { activeNodeId: "execute", label: "Step 5 — run_check", stateSnapshot: { action: "run_check", returncode: 0, stderr: "" }, explanation: "Real execution: both asserts pass. This, not the LLM's belief, confirms the fix." },
    { activeNodeId: "decide",  label: "Step 6 — answer", stateSnapshot: { iterations: 6, final_answer: "Missing base case for n=0…" }, explanation: "With a passing check, the agent reports the bug and fix." },
  ],
  codeSnippets: {
    decide: `class _SWEAction(BaseModel):
    action: Literal["list_files", "read_file", "write_file", "run_check", "answer"]
    path: str = ""      # relative to the sandbox
    content: str = ""   # full new contents for write_file
    answer: str = ""
    rationale: str`,
    execute: `def _safe_path(self, p):
    """Resolve and verify the path stays inside working_dir."""
    full = (self.working_dir / p).resolve()
    try:
        full.relative_to(self.working_dir)   # rejects '..' and absolute paths
    except ValueError as e:
        raise PermissionError(f"path '{p}' escapes sandbox") from e
    return full

# run_check
proc = subprocess.run([sys.executable, str(full)], cwd=self.working_dir,
                      capture_output=True, text=True, timeout=10)
observation = f"rc={proc.returncode}\\nstdout: {proc.stdout}\\nstderr: {proc.stderr}"`,
  },
};
