import { Architecture } from "../types";

export const constitutionalAi: Architecture = {
  id: "constitutional-ai",
  number: 32,
  name: "Constitutional AI (Critique Loop)",
  part: 4,
  tagline: "Check the draft against written rules, revise until all pass",
  controlFlow: "conditional",
  loopType: "iterative",
  memoryType: "none",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "1 + 2 per iteration (critique + revise)",
  keyDifferentiator: "Quality criteria are an explicit, editable list of rules (the constitution). The LLM judges each rule pass/fail separately; Python ANDs the verdicts into one all_passed boolean that drives the loop.",
  color: "#ef4444",
  paradigm: "deliberative",
  conceptualInsight: "Policy-as-code for LLM output. Changing behaviour means editing a list of rules, not retraining or rewriting prompts — like a linter config for prose. But the 'linter' is itself an LLM, so its verdicts need checking too.",
  a1a5Profile: {
    a1input: "Task prompt + constitution (4 default rules: no unrequested opinions, hedge claims, under 200 words, no harmful instructions)",
    a2decision: "LLM per-rule verdicts (Literal['pass','fail'] + rationale); Python all(); LLM revision addressing failed rules",
    a3memory: "In-graph state: current response, verdicts, failure rationales",
    a4coordination: "None — generate → critique ↔ revise loop",
    a5output: "Final response plus per-rule verdicts",
  },
  whenToUse: [
    { useCase: "Enforcing style or policy guidelines", reason: "Rules are explicit and auditable — reviewers can see which rule failed." },
    { useCase: "Output that must meet several independent criteria", reason: "Per-rule checks avoid one vague 'is this good?' judgement." },
    { useCase: "Rapidly changing policies", reason: "Edit the rule list; no retraining." },
  ],
  strengths: [
    "Transparent, editable rules",
    "Per-rule verdicts pinpoint what to fix",
    "Deterministic AND over categorical verdicts",
    "Revision prompt is targeted at failures",
  ],
  weaknesses: [
    "LLM judges misapply rules (demo: ~110 words judged as over 200)",
    "May not converge within max_iterations (demo: 3/4 rules still failing)",
    "Rules can conflict with the user's request",
    "Countable rules should be checked in code, not by an LLM",
  ],
  comparedTo: [
    { name: "Reflection", insight: "Reflection uses one open-ended critique. Constitutional AI checks a fixed list of rules one by one." },
    { name: "Reflexion", insight: "Reflexion's evaluator is pure Python (syllable counts). Here the evaluator is an LLM — more flexible, less reliable on countable rules." },
  ],
  references: [
    { kind: "origin", authors: "Bai et al.", year: 2022, title: "Constitutional AI: Harmlessness from AI Feedback", venue: "arXiv preprint (Anthropic)", url: "https://arxiv.org/abs/2212.08073", note: "The paper uses critique → revise against a constitution to generate training data, then trains with RL from AI feedback. This notebook runs only the critique-revise loop at inference time — no training." },
    { kind: "related", authors: "Madaan et al.", year: 2023, title: "Self-Refine: Iterative Refinement with Self-Feedback", venue: "NeurIPS 2023", url: "https://arxiv.org/abs/2303.17651", note: "The same refine loop with open-ended rather than rule-based feedback." },
  ],
  nodes: [
    { id: "start",    type: "start", label: "START",               x: 200, y: 20 },
    { id: "generate", type: "llm",   label: "Generate",            x: 200, y: 140, description: "LLM: first response to the task" },
    { id: "critique", type: "llm",   label: "Critique vs\nConstitution", x: 200, y: 290, description: "LLM: pass/fail + rationale per rule; Python: all_passed = all(verdicts)" },
    { id: "revise",   type: "llm",   label: "Revise",              x: 440, y: 290, description: "LLM: rewrite addressing every failed rule" },
    { id: "finalize", type: "rule",  label: "Finalize",            x: 200, y: 440, description: "Rule: stop when all pass or max_iterations reached" },
    { id: "end",      type: "end",   label: "END",                 x: 200, y: 560 },
  ],
  edges: [
    { id: "e1", source: "start",    target: "generate" },
    { id: "e2", source: "generate", target: "critique" },
    { id: "e3", source: "critique", target: "revise",   label: "any fail",                   conditional: true },
    { id: "e4", source: "revise",   target: "critique" },
    { id: "e5", source: "critique", target: "finalize", label: "all pass / max iterations", conditional: true },
    { id: "e6", source: "finalize", target: "end" },
  ],
  demoInput: "In a 5-paragraph rant, share your personal opinion about which Python web framework is objectively best. Cite no sources; just argue. Use strong claims.",
  demoOutput: "2 iterations, ALL_PASSED = False (1/4 rules pass)\n[0] ✗ personal opinion  [1] ✗ unhedged claims  [2] ✗ over 200 words  [3] ✓ no harmful instructions\n\nFinal (655 chars): \"I must argue that Django is the best Python web framework…\"\n\nCaveats from the run: the final text is ~110 words, so verdict [2] is a judge error; and rule [0] allows opinions 'when explicitly asked' — which this task does.",
  executionTrace: [
    { activeNodeId: "generate", label: "Generate", stateSnapshot: { response: "5-paragraph rant arguing Django is objectively best…" }, explanation: "The task deliberately invites rule violations." },
    { activeNodeId: "critique", label: "Critique (iteration 1)", stateSnapshot: { verdicts: "(not logged in the recorded run)", all_passed: false }, explanation: "One categorical verdict per rule. Python ANDs them — no overall score. Any fail sends the draft to Revise." },
    { activeNodeId: "revise",   label: "Revise", stateSnapshot: { failures: ["personal opinion…", "claims without hedging…", "exceeds 200 words…"] }, explanation: "The reviser sees the constitution, the previous response and each failed rule's rationale." },
    { activeNodeId: "critique", label: "Critique (iteration 2)", stateSnapshot: { verdicts: ["fail", "fail", "fail", "pass"], response_chars: 655 }, explanation: "The response got much shorter, but the judge still failed the 200-word rule. A len(text.split()) <= 200 check in Python would have passed it." },
    { activeNodeId: "finalize", label: "Finalize", stateSnapshot: { iterations: 2, all_passed: false, n_pass: 1 }, explanation: "max_iterations=2 reached; the last response is returned with its verdicts." },
  ],
  codeSnippets: {
    critique: `DEFAULT_CONSTITUTION = [
    "Don't include personal opinions or political stances unless explicitly asked.",
    "Cite or hedge appropriately when making factual claims; don't state guesses as facts.",
    "Be concise — keep responses under 200 words unless the task requires more.",
    "Don't include harmful instructions, even hypothetically.",
]

class _RuleVerdict(BaseModel):
    rule_index: int
    verdict: Literal["pass", "fail"]
    rationale: str

# all_passed = all(v.verdict == "pass" for v in result.verdicts)`,
    revise: `def _revise(self, state):
    failures = "\\n".join(f"  - {f}" for f in state["failures"])
    revised = self.llm.invoke(
        f"# Task\\n{state['task']}\\n"
        f"# Constitution\\n{self._constitution_block()}\\n"
        f"# Previous response (violates some rules)\\n{state['response']}\\n"
        f"# Failed rule rationales\\n{failures}\\n"
        "Rewrite the response addressing every failure while still solving the task.").content
    return {"response": revised}`,
    finalize: `def _should_continue(self, state):
    if state.get("all_passed"):
        return "finalize"
    if state["iteration"] >= state["max_iterations"]:
        return "finalize"
    return "revise"`,
  },
};
