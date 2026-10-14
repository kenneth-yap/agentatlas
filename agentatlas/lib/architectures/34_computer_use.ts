import { Architecture } from "../types";

export const computerUse: Architecture = {
  id: "computer-use",
  number: 34,
  name: "Computer Use (Safety-Gated)",
  part: 4,
  tagline: "Screen → click/type loop with a hard Python safety gate on every action",
  controlFlow: "conditional",
  loopType: "reactive",
  memoryType: "message_history",
  toolUse: true,
  llmDriven: true,
  llmCallsPerTask: "1 per action (≤ max_iterations)",
  keyDifferentiator: "Every action the LLM proposes passes through a deterministic Python gate BEFORE execution: typing sensitive patterns (password, ssn, credit card, api_key…) or navigating to blocked domains is refused. The model cannot argue its way past code.",
  color: "#ef4444",
  paradigm: "reactive",
  conceptualInsight: "Defence in depth: never rely on the model to police itself. The gate is a policy-enforcement point in the request path — like a WAF in front of a web app — that is deterministic, testable and independent of prompt content.",
  a1a5Profile: {
    a1input: "Instruction plus a mock screen state (dict) — no real OS access",
    a2decision: "LLM proposes one action: screenshot | click | type | navigate | submit | answer; Python gate returns allowed: bool",
    a3memory: "Action log (attempted, allowed/blocked, reasons) and current screen dict",
    a4coordination: "None — single agent; decide → gate → execute loop",
    a5output: "Answer plus a log of blocked actions",
  },
  whenToUse: [
    { useCase: "Any agent that can act on real systems", reason: "Hard rules catch prompt-injected or mistaken actions before they run." },
    { useCase: "Prototyping a UI agent safely", reason: "The mock screen lets you test the loop without touching an OS." },
    { useCase: "Compliance requirements", reason: "Gate decisions are logged and reproducible." },
  ],
  strengths: [
    "Deterministic, unit-testable safety policy",
    "Blocks are logged with reasons",
    "No OS risk in this mock version",
    "Composes with human approval (Dry-Run, #14)",
  ],
  weaknesses: [
    "Pattern lists are easy to bypass with paraphrases",
    "Mock screen ≠ real UI complexity",
    "Agent may loop on blocked actions (demo: 4 blocked navigations in a row)",
    "Without real page content, answers can silently come from model memory (demo)",
  ],
  comparedTo: [
    { name: "Dry-Run Harness", insight: "Dry-Run asks a human to approve. The Computer-Use gate is automatic code. Production systems use both." },
    { name: "SWE-Agent", insight: "Both constrain tools. SWE-Agent sandboxes file paths; Computer Use filters actions by content and destination." },
  ],
  references: [
    { kind: "origin", authors: "Anthropic", year: 2024, title: "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku", venue: "Anthropic announcement", url: "https://www.anthropic.com/news/3-5-models-and-computer-use", note: "Introduced the screenshot → click/type loop for a frontier model. This notebook mocks the screen and focuses on the safety-gate pattern around it." },
    { kind: "related", authors: "Ruan et al.", year: 2024, title: "Identifying the Risks of LM Agents with an LM-Emulated Sandbox (ToolEmu)", venue: "ICLR 2024", url: "https://arxiv.org/abs/2309.15817", note: "Evaluates how often tool-using agents take risky actions — the threat model the gate addresses." },
  ],
  nodes: [
    { id: "start",       type: "start", label: "START",          x: 200, y: 20 },
    { id: "decide",      type: "llm",   label: "Decide\nAction",  x: 200, y: 140, description: "LLM: screenshot | click | type | navigate | submit | answer" },
    { id: "safety_gate", type: "rule",  label: "Safety\nGate",    x: 200, y: 280, description: "Rule: block sensitive text patterns and blocked domains → allowed: bool + reason" },
    { id: "execute",     type: "tool",  label: "Execute on\nMock Screen", x: 200, y: 420, description: "Tool: mutate the screen dict; skipped entirely if blocked" },
    { id: "end",         type: "end",   label: "END",            x: 200, y: 560 },
  ],
  edges: [
    { id: "e1", source: "start",       target: "decide" },
    { id: "e2", source: "decide",      target: "safety_gate" },
    { id: "e3", source: "safety_gate", target: "execute" },
    { id: "e4", source: "execute",     target: "decide", label: "continue", conditional: true },
    { id: "e5", source: "execute",     target: "end",    label: "answer",   conditional: true },
  ],
  demoInput: "(1) Navigate to https://example.com and return the main heading.  (2) Navigate to https://evil-phishing.com/login and read what's there.",
  demoOutput: "(2) blocked_nav: 4 navigate attempts → 4 BLOCKED by the gate (domain 'evil-phishing.com') → agent gives up.  ✓ gate held\n\n(1) real_nav: 4 navigates, page text 0 chars, current_url empty, yet answer = \"Example Domain\". The answer came from the model's prior knowledge, not the screen — a silent grounding failure worth checking for.",
  executionTrace: [
    { activeNodeId: "decide",      label: "Decide", stateSnapshot: { action: "navigate", target: "https://evil-phishing.com/login" }, explanation: "The LLM follows the user's instruction literally." },
    { activeNodeId: "safety_gate", label: "Gate", stateSnapshot: { allowed: false, block_reason: "navigation to blocked domain 'evil-phishing.com'", blocked_count: 1 }, explanation: "A substring check in Python — no LLM involved, so no prompt can talk it out of the decision." },
    { activeNodeId: "execute",     label: "Execute (skipped)", stateSnapshot: { skipped_blocked: true }, explanation: "Blocked actions never touch the screen. The agent sees the block on its next turn." },
    { activeNodeId: "decide",      label: "Retries → answer", stateSnapshot: { action_sequence: ["navigate", "navigate", "navigate", "navigate", "answer"], n_blocked: 4 }, explanation: "The agent retried 3 more times before answering — the gate held every time." },
  ],
  codeSnippets: {
    safety_gate: `DEFAULT_SENSITIVE_PATTERNS = ["password", "passwd", "ssn", "social security",
                              "credit card", "cvv", "api_key", "secret_key"]

def _check_safety(self, action):
    """Python-only safety verdict. Categorical bool — no LLM in the loop."""
    kind = action["action"]
    value = (action.get("value") or "").lower()
    target = (action.get("target") or "").lower()
    if kind == "type":
        for pat in self.sensitive_patterns:
            if pat in value:
                return False, f"contains blocked pattern '{pat}'"
    if kind == "navigate":
        for dom in self.blocked_domains:
            if dom.lower() in target:
                return False, f"navigation to blocked domain '{dom}'"
    return True, "ok"`,
    decide: `class _ComputerAction(BaseModel):
    action: Literal["screenshot", "click", "type", "navigate", "submit", "answer"]
    target: str = ""   # element name or URL
    value: str = ""    # text to type, or final answer
    rationale: str`,
  },
};
