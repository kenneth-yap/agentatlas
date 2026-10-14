import { Architecture } from "../types";

export const reflexion: Architecture = {
  id: "reflexion",
  number: 18,
  name: "Reflexion",
  part: 5,
  tagline: "Try → evaluate → write a lesson → retry, remembering the lesson",
  controlFlow: "conditional",
  loopType: "iterative",
  memoryType: "vector",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "2 per failed trial (≤ 2×max_trials)",
  keyDifferentiator: "Unlike Reflection (one critique, then forgotten), Reflexion turns each failure into a written lesson stored in episodic memory. Lessons persist across run() calls, so the agent stops repeating the same mistake on similar future tasks.",
  color: "#8b5cf6",
  paradigm: "learning",
  conceptualInsight: "'Verbal reinforcement learning': the reward signal updates a text memory instead of model weights. Learning becomes a database write — cheap, inspectable, and reversible — rather than a gradient step.",
  a1a5Profile: {
    a1input: "Task with checkable constraints (e.g. a haiku that must be 5-7-5 and contain two required words)",
    a2decision: "LLM attempts the task; a pure-Python checker decides pass/fail; a second LLM call writes the reflection on failure",
    a3memory: "Episodic memory (FAISS vector store) of past reflections — recalled by similarity to the new task, persists across runs",
    a4coordination: "None — single agent looping over attempt → evaluate → reflect",
    a5output: "Final attempt text plus a growing library of self-written lessons",
  },
  whenToUse: [
    { useCase: "Repeated tasks of the same kind", reason: "Lessons transfer: a syllable-counting mistake on one haiku helps on the next haiku." },
    { useCase: "Tasks with an objective checker", reason: "Unit tests, schema validators or rule checks give a trustworthy pass/fail signal to reflect on." },
    { useCase: "Agents that should improve without fine-tuning", reason: "All learning lives in an editable text store — no training pipeline required." },
  ],
  strengths: [
    "Learns across runs with zero weight updates",
    "Lessons are human-readable and auditable",
    "Deterministic evaluator avoids LLM-as-judge score flattening",
    "Lesson store can be shared between agent instances",
  ],
  weaknesses: [
    "Only as good as the evaluator — no checker, no signal",
    "A correct lesson can still fail to change behaviour (the demo's subway haiku failed 3/3 trials)",
    "Memory grows unbounded and can recall irrelevant lessons",
    "Extra LLM call per failure",
  ],
  comparedTo: [
    { name: "Reflection", insight: "Reflection critiques one draft once and forgets. Reflexion stores the critique as a lesson and recalls it on future, similar tasks." },
    { name: "Self-Improvement (RLHF)", insight: "RLHF archives successful outputs (positive examples). Reflexion archives lessons from failures (negative experience phrased as corrections)." },
    { name: "Agent Workflow Memory", insight: "AWM stores recipes that worked; Reflexion stores lessons from what failed. Both are retrieval-based learning." },
  ],
  references: [
    { kind: "origin", authors: "Shinn et al.", year: 2023, title: "Reflexion: Language Agents with Verbal Reinforcement Learning", venue: "NeurIPS 2023", url: "https://arxiv.org/abs/2303.11366", note: "Same loop: act, get feedback, write a verbal self-reflection into an episodic buffer, retry. This notebook uses a deterministic Python checker as the evaluator." },
    { kind: "related", authors: "Madaan et al.", year: 2023, title: "Self-Refine: Iterative Refinement with Self-Feedback", venue: "NeurIPS 2023", url: "https://arxiv.org/abs/2303.17651", note: "Refines a single output in-context; nothing carries over to the next task." },
  ],
  nodes: [
    { id: "start",    type: "start",  label: "START",            x: 200, y: 20 },
    { id: "attempt",  type: "llm",    label: "Attempt\n(+lessons)", x: 200, y: 160, description: "LLM: recalls top-k past reflections from episodic memory and attempts the task" },
    { id: "evaluate", type: "rule",   label: "Evaluate",         x: 200, y: 300, description: "Rule: pure-Python checker (syllables, required words) → passed: bool" },
    { id: "reflect",  type: "llm",    label: "Reflect &\nStore", x: 440, y: 230, description: "LLM: writes root_cause + correction; stored verbatim in episodic memory" },
    { id: "memory",   type: "memory", label: "Episodic\nMemory", x: 440, y: 90,  description: "FAISS store of past reflections; persists across run() calls" },
    { id: "finalize", type: "rule",   label: "Finalize",         x: 200, y: 440, description: "Return the last attempt" },
    { id: "end",      type: "end",    label: "END",              x: 200, y: 560 },
  ],
  edges: [
    { id: "e1", source: "start",    target: "attempt" },
    { id: "e2", source: "attempt",  target: "evaluate" },
    { id: "e3", source: "evaluate", target: "finalize", label: "passed or max trials", conditional: true },
    { id: "e4", source: "evaluate", target: "reflect",  label: "failed",               conditional: true },
    { id: "e5", source: "reflect",  target: "memory",   label: "record" },
    { id: "e6", source: "memory",   target: "attempt",  label: "recall" },
    { id: "e7", source: "finalize", target: "end" },
  ],
  demoInput: "Write a haiku about a subway. It MUST contain \"midnight\" and \"rumble\" and follow strict 5-7-5 syllables.",
  demoOutput: "Recorded run (Llama-3.3-70B): 3 trials, all [5, 6, 4] syllables → FAILED.\nFinal: Midnight subway dark / Rumble of the trains beneath / City's gentle hum\n\nLesson stored: \"You under-counted syllables in the second line, which had 6 syllables instead of 7. Count syllables of each line before submitting.\"\n\nThe glacier and library haikus passed on trial 1.",
  executionTrace: [
    { activeNodeId: "attempt",  label: "Trial 1 — Attempt", stateSnapshot: { trial: 1, recalled_reflections: [], attempt_text: "Midnight subway dark / Rumble of the trains beneath / City's gentle hum" }, explanation: "Memory is empty, so no lessons are recalled. The LLM writes a first haiku." },
    { activeNodeId: "evaluate", label: "Trial 1 — Evaluate", stateSnapshot: { syllable_counts: [5, 6, 4], meets_5_7_5: false, required_words_present: true, passed: false }, explanation: "The Python checker counts syllables per line. Lines 2 and 3 are short, so passed=false. No LLM judge involved." },
    { activeNodeId: "reflect",  label: "Trial 1 — Reflect", stateSnapshot: { root_cause: "Line 2 had 6 syllables instead of 7", correction: "Count syllables of each line before submitting" }, explanation: "A second LLM call writes a second-person lesson. It is recorded into episodic memory immediately." },
    { activeNodeId: "memory",   label: "Store lesson", stateSnapshot: { episodes_in_memory: 1 }, explanation: "The lesson is embedded and stored. Future attempts on similar tasks will retrieve it by similarity." },
    { activeNodeId: "attempt",  label: "Trial 2 — Attempt with lesson", stateSnapshot: { trial: 2, recalled_reflections: ["You under-counted syllables in the second line…"] }, explanation: "The lesson is prepended to the prompt. In the recorded run the model still produced 5-6-4 — a reminder that a lesson in context is not a guarantee." },
    { activeNodeId: "finalize", label: "Trial 3 — Max trials reached", stateSnapshot: { trial: 3, success: false, total_reflections_in_memory: 2 }, explanation: "After max_trials the loop stops and returns the last attempt. The 2 lessons remain in memory for the next run() call." },
  ],
  codeSnippets: {
    attempt: `def _attempt(self, state):
    recalled = []
    if self.episodic.episodes:
        episodes = self.episodic.recall(state["task"], k=self.reflections_to_recall)
        recalled = [ep.content for ep in episodes]
    lessons = "\\n".join(f"- {r}" for r in recalled)
    prompt = f"## Current task\\n{state['task']}\\n" \\
             f"## Lessons from past attempts\\n{lessons}\\n" \\
             "Produce ONLY the answer."
    return {"attempt_text": self.llm.invoke(prompt).content,
            "trial": state.get("trial", 0) + 1,
            "recalled_reflections": recalled}`,
    evaluate: `def default_haiku_checker(candidate, task_spec):
    lines = [l for l in candidate.splitlines() if l.strip()][:3]
    syllable_counts = [_line_syllables(l) for l in lines]
    meets_5_7_5 = syllable_counts == [5, 7, 5]
    words_ok = all(w in candidate.lower() for w in required)
    return {"syllable_counts": syllable_counts,
            "meets_5_7_5": meets_5_7_5,
            "passed": len(lines) == 3 and meets_5_7_5 and words_ok}`,
    reflect: `class _SelfReflection(BaseModel):
    root_cause: str   # ONE sentence: precisely why it failed
    correction: str   # ONE sentence, imperative
    reflection: str   # 2-4 sentences, second person — stored verbatim

def _reflect(self, state):
    sr = self._reflector.invoke(reflection_prompt(state))
    self.episodic.record(sr.reflection, task=state["task"],
                         root_cause=sr.root_cause, correction=sr.correction)
    return {"reflection_text": sr.reflection}`,
    finalize: `def _should_reflect(self, state):
    if state.get("success"):
        return "finalize"
    if state.get("trial", 0) >= self.max_trials:
        return "finalize"
    return "reflect"`,
  },
};
