import { Architecture } from "../types";

export const chainOfVerification: Architecture = {
  id: "chain-of-verification",
  number: 20,
  name: "Chain-of-Verification",
  part: 4,
  tagline: "Draft → plan fact-checks → answer them blind → revise",
  controlFlow: "linear",
  loopType: "none",
  memoryType: "none",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "3 + one per verification question",
  keyDifferentiator: "Verification questions are answered WITHOUT seeing the draft. That independence is the trick: the model can't confabulate to stay consistent with its own earlier (wrong) claims.",
  color: "#ef4444",
  paradigm: "deliberative",
  conceptualInsight: "Hallucinations often survive self-review because the reviewer anchors on the draft. CoVe breaks the anchor by decomposing the review into atomic questions asked in isolation — like asking witnesses separately instead of together.",
  a1a5Profile: {
    a1input: "Fact-heavy question (lists, dates, attributions)",
    a2decision: "LLM: baseline answer → verification-question planner → independent answerer (per question) → reviser making keep/drop decisions",
    a3memory: "In-graph state only: baseline, questions, answers with confidence levels",
    a4coordination: "None — linear 4-stage pipeline",
    a5output: "Revised answer plus a list of changes (claims dropped, corrected, kept)",
  },
  whenToUse: [
    { useCase: "List-style factual questions", reason: "Each list item becomes a claim that can be checked on its own." },
    { useCase: "No retrieval corpus available", reason: "Reduces hallucination using only the model's own knowledge." },
    { useCase: "Auditable answers", reason: "The questions, answers and change log show exactly why each claim survived." },
  ],
  strengths: [
    "Targets hallucination without external tools",
    "Every claim gets its own check",
    "Categorical keep/drop — no numeric scoring to calibrate",
    "Change log makes revisions transparent",
  ],
  weaknesses: [
    "Can't catch errors the model is confidently wrong about in both passes",
    "Cost grows with the number of claims",
    "May drop true claims when verification is uncertain",
  ],
  comparedTo: [
    { name: "Reflection", insight: "Reflection asks for one holistic critique of the draft. CoVe splits the critique into independent atomic checks that never see the draft." },
    { name: "Corrective RAG", insight: "CRAG checks the evidence (retrieved docs). CoVe checks the claims in the answer." },
  ],
  references: [
    { kind: "origin", authors: "Dhuliawala et al.", year: 2024, title: "Chain-of-Verification Reduces Hallucination in Large Language Models", venue: "Findings of ACL 2024", url: "https://arxiv.org/abs/2309.11495", note: "Closest to the paper's 'factor + revise' variant: each verification question is answered in its own call, isolated from the baseline, then a final step revises." },
  ],
  nodes: [
    { id: "start",    type: "start", label: "START",               x: 200, y: 20 },
    { id: "baseline", type: "llm",   label: "Baseline\nAnswer",    x: 200, y: 130, description: "LLM: answers normally — may contain hallucinated claims" },
    { id: "plan",     type: "llm",   label: "Plan\nQuestions",     x: 200, y: 250, description: "LLM: one standalone question per specific factual claim" },
    { id: "execute",  type: "llm",   label: "Answer\nIndependently", x: 200, y: 370, description: "LLM ×N: answers each question WITHOUT seeing the baseline; reports confidence" },
    { id: "revise",   type: "llm",   label: "Revise",              x: 200, y: 490, description: "LLM: keeps verified claims, drops or corrects contradicted ones" },
    { id: "end",      type: "end",   label: "END",                 x: 200, y: 600 },
  ],
  edges: [
    { id: "e1", source: "start",    target: "baseline" },
    { id: "e2", source: "baseline", target: "plan" },
    { id: "e3", source: "plan",     target: "execute" },
    { id: "e4", source: "execute",  target: "revise" },
    { id: "e5", source: "revise",   target: "end" },
  ],
  demoInput: "Name 5 novels by Ursula K. Le Guin that won the Hugo Award for Best Novel, with the year of the win.",
  demoOutput: "1. The Left Hand of Darkness (1970)\n2. The Dispossessed (1975)\n\nOnly 2 such novels exist. In the recorded run the baseline already refused to invent three more, so all 4 verification questions confirmed it and 0 changes were made — CoVe adds cost but no correction when the baseline is already right.",
  executionTrace: [
    { activeNodeId: "baseline", label: "Stage 1 — Baseline", stateSnapshot: { baseline_response: "1. The Left Hand of Darkness (1970)\n2. The Dispossessed (1975)" }, explanation: "The model answers normally. The prompt asks for 5; a weaker model would pad the list with non-winners." },
    { activeNodeId: "plan",     label: "Stage 2 — Plan questions", stateSnapshot: { questions: ["Is 'The Left Hand of Darkness' by Le Guin?", "Did it win the Hugo for Best Novel in 1970?", "Is 'The Dispossessed' by Le Guin?", "Did it win the Hugo in 1975?"] }, explanation: "Each question targets one claim and is phrased so it can be answered without the baseline." },
    { activeNodeId: "execute",  label: "Stage 3 — Answer blind", stateSnapshot: { answers: 4, low_confidence: 0 }, explanation: "Each question is a separate LLM call with no access to the draft — this independence is what prevents self-consistent confabulation." },
    { activeNodeId: "revise",   label: "Stage 4 — Revise", stateSnapshot: { changes_made: [], revised_lines: 2 }, explanation: "All claims were verified, so nothing changed. When a check contradicts a claim, the reviser drops or corrects that line and logs why." },
  ],
  codeSnippets: {
    plan: `class _VerificationQuestions(BaseModel):
    questions: list[str] = Field(
        min_length=2, max_length=10,
        description="Each targets ONE claim; standalone, answerable without the baseline")`,
    execute: `class _VerificationAnswer(BaseModel):
    question: str
    answer: str
    confidence: str   # 'high' | 'medium' | 'low'

def _execute(self, state):
    # Deliberately NOT passing state["baseline_response"] here.
    answers = [self._executor.invoke(f"Answer factually: {q}")
               for q in state["verification_questions"]]
    return {"verification_answers": [a.model_dump() for a in answers]}`,
    revise: `class _RevisedResponse(BaseModel):
    revised_response: str     # keep only confirmed claims
    changes_made: list[str]   # empty list = no changes needed`,
  },
};
