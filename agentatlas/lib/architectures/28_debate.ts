import { Architecture } from "../types";

export const debate: Architecture = {
  id: "debate",
  number: 28,
  name: "Multi-Agent Debate",
  part: 2,
  tagline: "N agents answer, read each other, revise; majority vote at the end",
  controlFlow: "conditional",
  loopType: "fixed",
  memoryType: "message_history",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "N agents × K rounds (demo: 3 × 2 = 6)",
  keyDifferentiator: "Unlike Ensemble or Self-Consistency, the voters are not independent: each round every agent sees the others' previous answers and critiques, and may change its mind. The final answer is a Python majority vote over the last round.",
  color: "#10b981",
  paradigm: "mas",
  conceptualInsight: "Debate trades independence for information sharing. That can fix a lone mistaken agent — or spread a confident wrong argument (herding). The recorded demo shows a subtler failure: the right argument spread, but the answer fields never caught up with it.",
  a1a5Profile: {
    a1input: "Question with a short answer",
    a2decision: "3 persona LLMs (rigorous, sceptical, pragmatic) each emit {answer, critique_of_others}; Python Counter on the final round",
    a3memory: "Round history: every agent's answer and critique from previous rounds",
    a4coordination: "Synchronous rounds — broadcast all answers to all agents between rounds",
    a5output: "Majority answer, final tally, and a convergence label (full / partial / none)",
  },
  whenToUse: [
    { useCase: "Factual questions where one agent may hallucinate", reason: "Peers can catch an outlier claim and argue it down." },
    { useCase: "Studying group reasoning dynamics", reason: "Round-by-round logs show who persuaded whom." },
    { useCase: "When diverse perspectives matter", reason: "Distinct personas surface different failure modes." },
  ],
  strengths: [
    "Agents can correct each other",
    "Critiques make disagreement explicit",
    "Deterministic Python vote at the end",
    "Convergence is a useful confidence signal",
  ],
  weaknesses: [
    "Voting only sees the answer field — in the demo, correct reasoning in critiques never reached the vote",
    "N × K calls — expensive",
    "Same base model shares the same blind spots",
    "Prompts grow with each round",
  ],
  comparedTo: [
    { name: "Ensemble", insight: "Ensemble's analysts never see each other. Debate's agents read and react to each other." },
    { name: "Self-Consistency", insight: "Self-Consistency relies on independent errors cancelling out. Debate deliberately breaks independence to share arguments." },
  ],
  references: [
    { kind: "origin", authors: "Du et al.", year: 2024, title: "Improving Factuality and Reasoning in Language Models through Multiagent Debate", venue: "ICML 2024", url: "https://arxiv.org/abs/2305.14325", note: "Same rounds of answer → read peers → revise. This notebook adds explicit personas and a Python majority vote over the last round." },
    { kind: "related", authors: "Wang et al.", year: 2023, title: "Self-Consistency Improves Chain of Thought Reasoning in Language Models", venue: "ICLR 2023", url: "https://arxiv.org/abs/2203.11171", note: "The independent-voting baseline that debate is compared against." },
  ],
  nodes: [
    { id: "start", type: "start", label: "START",                 x: 250, y: 20 },
    { id: "round", type: "llm",   label: "Debate Round\n(A, B, C)", x: 250, y: 150, description: "LLM ×N: each persona reads prior answers and emits {answer, critique_of_others}" },
    { id: "check", type: "rule",  label: "Rounds\nleft?",          x: 470, y: 260, description: "Rule: round < K → another round; else vote (LangGraph conditional edge)" },
    { id: "vote",  type: "rule",  label: "Majority\nVote",         x: 250, y: 380, description: "Rule: Counter over the last round's normalised answers" },
    { id: "end",   type: "end",   label: "END",                    x: 250, y: 510 },
  ],
  edges: [
    { id: "e1", source: "start", target: "round" },
    { id: "e2", source: "round", target: "check" },
    { id: "e3", source: "check", target: "round", label: "round < K", conditional: true },
    { id: "e5", source: "check", target: "vote",  label: "round = K", conditional: true },
    { id: "e4", source: "vote",  target: "end" },
  ],
  demoInput: "Sally is a girl with 3 brothers. Each of her brothers has 2 sisters. How many sisters does Sally have?  (expected: 1)",
  demoOutput: "FINAL: \"0\"  ✗ (expected 1)\nRound 1: A=2, B=2, C=2  — unanimous but wrong\nRound 2: A=0, B=0, C=2 → tally {'0': 2, '2': 1}\n\nThe twist: in round 2 all three critiques reason \"…one of them must be Sally herself, so only one other sister\" — the correct logic — yet the separate answer fields say 0 or 2. The structured answer field drifted from the agent's own reasoning. Same question: Self-Consistency (#21) got 7/7 correct.",
  executionTrace: [
    { activeNodeId: "round", label: "Round 1", stateSnapshot: { round: 1, answers: { A: "2", B: "2", C: "2" }, critique: "(round 1 — no prior answers)" }, explanation: "Each persona answers independently. All three make the same mistake: counting the brothers' 2 sisters as Sally's sisters." },
    { activeNodeId: "round", label: "Round 2", stateSnapshot: { round: 2, answers: { A: "0", B: "0", C: "2" }, critique_A: "…one of them must be Sally herself, it means that there is only 1 other…" }, explanation: "Every critique now contains the correct insight (Sally is one of the 2 sisters → 1 other), but none of the answer fields says 1. Reading peers changed the reasoning; the committed answers didn't follow it." },
    { activeNodeId: "vote",  label: "Vote", stateSnapshot: { final_tally: { "0": 2, "2": 1 }, final_answer: "0", convergence: "partial" }, explanation: "Python votes on the answer fields only, so the correct reasoning in the critiques is lost. Lesson: when you vote on a structured field, validate that it agrees with the reasoning that produced it." },
  ],
  codeSnippets: {
    round: `AGENT_PERSONAS = [
    "You are Agent A: rigorous, demands step-by-step reasoning...",
    "You are Agent B: skeptical, actively looks for counterexamples...",
    "You are Agent C: pragmatic, focuses on which answer best fits the evidence.",
]

class _DebateResponse(BaseModel):
    answer: str
    critique_of_others: str

def _round(self, state):
    last = state["rounds"][-1] if state.get("rounds") else []
    prior = "\\n".join(f"Agent {chr(65+int(r['agent_id']))}: '{r['answer']}' — {r['critique']}"
                       for r in last)
    responses = [self._responder.invoke(f"{p}\\n# Task\\n{state['task']}\\n{prior}")
                 for p in self.personas]
    return {"rounds": [responses], "round": state.get("round", 0) + 1}`,
    check: `def _should_continue(self, state):
    if state.get("round", 0) >= state.get("n_rounds", self.n_rounds):
        return "vote"
    return "round"`,
    vote: `def _vote(self, state):
    last = state["rounds"][-1]
    norm = lambda s: s.strip().lower().rstrip(".")
    tally = Counter(norm(r["answer"]) for r in last if r["answer"].strip())
    winner, _ = tally.most_common(1)[0]
    return {"final_answer": winner, "final_tally": dict(tally)}`,
  },
};
