import { Architecture } from "../types";

export const selfConsistency: Architecture = {
  id: "self-consistency",
  number: 21,
  name: "Self-Consistency",
  part: 3,
  tagline: "Sample N reasoning paths, majority-vote the answer",
  controlFlow: "parallel",
  loopType: "none",
  memoryType: "none",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "N (default 5; demo used 7)",
  keyDifferentiator: "The picker is pure Python (collections.Counter), not an LLM. Each sample emits a structured (reasoning, answer) pair; the most frequent answer wins. The LLM never sees the votes, so it can't game them.",
  color: "#f59e0b",
  paradigm: "deliberative",
  conceptualInsight: "Wrong reasoning paths tend to scatter across many different wrong answers, while correct paths converge on the same one. Majority vote exploits that asymmetry — variance reduction, the same idea as bagging in classical ML.",
  a1a5Profile: {
    a1input: "Question with a short, normalisable final answer (number, name, choice)",
    a2decision: "N independent LLM samples at temperature ~0.8; Python Counter picks the modal answer",
    a3memory: "None",
    a4coordination: "Fan-out of identical samplers; no communication between samples",
    a5output: "Winning answer plus tally and agreement fraction (a free confidence signal)",
  },
  whenToUse: [
    { useCase: "Math and logic word problems", reason: "Short exact answers make voting reliable." },
    { useCase: "When you need a confidence estimate", reason: "Agreement fraction (e.g. 7/7 vs 4/7) is a cheap uncertainty signal." },
    { useCase: "Drop-in accuracy boost", reason: "No prompt engineering — just sample more and vote." },
  ],
  strengths: [
    "Simplest method that reliably improves reasoning accuracy",
    "Deterministic picker — no judge to calibrate",
    "Agreement fraction doubles as confidence",
    "Embarrassingly parallel",
  ],
  weaknesses: [
    "N× the cost of a single call",
    "Needs answers that can be normalised and compared",
    "Systematic model errors get voted in, not out",
    "Doesn't work for open-ended generation (essays, code)",
  ],
  comparedTo: [
    { name: "Ensemble", insight: "Ensemble uses different personas and an LLM synthesiser. Self-Consistency uses identical samplers and a Python vote." },
    { name: "Debate", insight: "Self-Consistency's samples never see each other. Debate's agents read each other's answers and can change their minds." },
  ],
  references: [
    { kind: "origin", authors: "Wang et al.", year: 2023, title: "Self-Consistency Improves Chain of Thought Reasoning in Language Models", venue: "ICLR 2023", url: "https://arxiv.org/abs/2203.11171", note: "Same sample-then-majority-vote decoding. This notebook enforces the answer field with a schema so the vote compares clean strings." },
    { kind: "related", authors: "Li et al.", year: 2024, title: "More Agents Is All You Need", venue: "TMLR", url: "https://arxiv.org/abs/2402.05120", note: "Shows accuracy keeps scaling as the number of sampled agents grows." },
  ],
  nodes: [
    { id: "start",      type: "start", label: "START",               x: 250, y: 20 },
    { id: "sample_all", type: "llm",   label: "Sample N\nPaths (T=0.8)", x: 250, y: 170, description: "LLM ×N: independent chain-of-thought samples, each returning {reasoning, answer}" },
    { id: "vote",       type: "rule",  label: "Majority\nVote",       x: 250, y: 340, description: "Rule: normalise answers, Counter.most_common(1)" },
    { id: "end",        type: "end",   label: "END",                  x: 250, y: 480 },
  ],
  edges: [
    { id: "e1", source: "start",      target: "sample_all" },
    { id: "e2", source: "sample_all", target: "vote" },
    { id: "e3", source: "vote",       target: "end" },
  ],
  demoInput: "Sally is a girl with 3 brothers. Each of her brothers has 2 sisters. How many sisters does Sally have?",
  demoOutput: "1  ✓\nTally: {'1': 7} — agreement 7/7\n\nBaseline: 7 single samples at T=0.9 gave {'1': 6, '2': 1} — a 14% error rate that voting removes.",
  executionTrace: [
    { activeNodeId: "sample_all", label: "Step 1 — Sample 7 paths", stateSnapshot: { n_samples: 7, sample_temperature: 0.9, answers: ["1", "1", "1", "1", "1", "1", "1"] }, explanation: "Seven independent calls with non-zero temperature, so each reasoning path can differ." },
    { activeNodeId: "vote",       label: "Step 2 — Vote", stateSnapshot: { tally: { "1": 7 }, final_answer: "1", agreement_fraction: 1.0 }, explanation: "Python counts normalised answers. Unanimous here; with a single sample, 1 run in 7 answered '2'." },
  ],
  codeSnippets: {
    sample_all: `class _ReasoningSample(BaseModel):
    reasoning: str
    answer: str   # JUST the final answer, e.g. '179'

def _sample_all(self, state):
    sampler = self.llm.bind(temperature=self.sample_temperature) \\
                      .with_structured_output(_ReasoningSample)
    # sequential loop for clarity; use asyncio.gather over ainvoke in production
    samples = [sampler.invoke(prompt) for _ in range(state["n_samples"])]
    return {"samples": [s.model_dump() for s in samples]}`,
    vote: `def _vote(self, state):
    def _norm(s): return s.strip().lower().rstrip(".")
    answers = [s["answer"] for s in state["samples"] if s.get("answer")]
    tally = Counter(_norm(a) for a in answers)
    winner, count = tally.most_common(1)[0]
    return {"final_answer": winner, "tally": dict(tally),
            "agreement_fraction": count / len(answers)}`,
  },
};
