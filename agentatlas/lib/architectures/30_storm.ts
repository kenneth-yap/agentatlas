import { Architecture } from "../types";

export const storm: Architecture = {
  id: "storm",
  number: 30,
  name: "STORM",
  part: 2,
  tagline: "Multi-perspective research → outline → long-form article",
  controlFlow: "linear",
  loopType: "none",
  memoryType: "none",
  toolUse: true,
  llmDriven: true,
  llmCallsPerTask: "≈ 3 + N perspectives + Q questions + S sections",
  keyDifferentiator: "Research is driven by perspectives, not by the topic alone. Generating distinct viewpoints first (technical, social, historical…) and having each ask its own questions widens coverage before any writing happens.",
  color: "#10b981",
  paradigm: "mas",
  conceptualInsight: "Mirrors how a journalist pre-writes: interview people with different stakes, then outline, then draft. Breadth comes from the question-asking stage — a planning step for information gathering rather than for actions.",
  a1a5Profile: {
    a1input: "A topic (e.g. 'The rise of agentic AI architectures in 2024')",
    a2decision: "LLM pipeline: perspectives → questions per perspective → answers → outline → section drafts",
    a3memory: "Accumulated Q&A pairs and outline in graph state",
    a4coordination: "Perspectives act as virtual specialists; a fixed sequential pipeline merges their findings",
    a5output: "Structured multi-section article plus the perspectives, questions and outline that produced it",
  },
  whenToUse: [
    { useCase: "Report or wiki-style article generation", reason: "Perspective-driven questions reduce one-sided coverage." },
    { useCase: "Research briefs on unfamiliar topics", reason: "The Q&A log doubles as a research trail." },
    { useCase: "When outlines matter", reason: "An explicit outline step makes the structure reviewable before drafting." },
  ],
  strengths: [
    "Broader coverage than single-prompt writing",
    "Every stage is inspectable (perspectives, questions, outline)",
    "Optional web grounding for answers",
    "Naturally decomposes into parallelisable calls",
  ],
  weaknesses: [
    "Many LLM calls for one article",
    "Without web search, answers come from the model's memory (hallucination risk)",
    "Perspectives can be shallow paraphrases",
    "No citation tracking in this simplified version",
  ],
  comparedTo: [
    { name: "Multi-Agent Systems", insight: "Both use specialised roles in a fixed pipeline. STORM's roles are generated per topic rather than hand-written." },
    { name: "Planning", insight: "The outline is a plan for the document; STORM adds a research phase before planning." },
  ],
  references: [
    { kind: "origin", authors: "Shao et al.", year: 2024, title: "Assisting in Writing Wikipedia-like Articles From Scratch with Large Language Models", venue: "NAACL 2024", url: "https://arxiv.org/abs/2402.14207", note: "The paper discovers perspectives from related Wikipedia articles and runs multi-turn simulated writer–expert conversations. This notebook brainstorms perspectives directly and asks single-turn questions." },
  ],
  nodes: [
    { id: "start",        type: "start", label: "START",              x: 200, y: 20 },
    { id: "perspectives", type: "llm",   label: "Brainstorm\nPerspectives", x: 200, y: 120, description: "LLM: N distinct viewpoints on the topic" },
    { id: "questions",    type: "llm",   label: "Questions per\nPerspective", x: 200, y: 230, description: "LLM ×N: K research questions from each viewpoint" },
    { id: "answer",       type: "tool",  label: "Answer\nQuestions",  x: 200, y: 340, description: "Tool/LLM: web search + summarise if configured, else answer from model knowledge" },
    { id: "outline",      type: "llm",   label: "Build\nOutline",      x: 200, y: 450, description: "LLM: 2–8 sections with key points" },
    { id: "write",        type: "llm",   label: "Write\nSections",     x: 200, y: 560, description: "LLM ×S: 2–4 paragraphs per section" },
    { id: "end",          type: "end",   label: "END",                 x: 200, y: 660 },
  ],
  edges: [
    { id: "e1", source: "start",        target: "perspectives" },
    { id: "e2", source: "perspectives", target: "questions" },
    { id: "e3", source: "questions",    target: "answer" },
    { id: "e4", source: "answer",       target: "outline" },
    { id: "e5", source: "outline",      target: "write" },
    { id: "e6", source: "write",        target: "end" },
  ],
  demoInput: "The rise of agentic AI architectures in 2024",
  demoOutput: "3 perspectives → 6 questions → 4-section outline → 4,990-character article.\n\nPerspectives:\n 1. Technical milestone: more autonomous, adaptive systems\n 2. Social questions: employment and distribution of wealth\n 3. Historical progression of machine-learning models",
  executionTrace: [
    { activeNodeId: "perspectives", label: "Perspectives", stateSnapshot: { n_perspectives: 3, perspectives: ["technical milestone…", "social impact on employment…", "historical progression…"] }, explanation: "Distinct framings set up the research breadth before any facts are gathered." },
    { activeNodeId: "questions",    label: "Questions", stateSnapshot: { n_questions: 6 }, explanation: "Each perspective asks its own questions — the social lens asks about jobs; the technical lens asks about architectures." },
    { activeNodeId: "answer",       label: "Answers", stateSnapshot: { answered: 6, source: "web search when configured, else LLM knowledge" }, explanation: "Each question gets a 1–2 sentence answer." },
    { activeNodeId: "outline",      label: "Outline", stateSnapshot: { n_sections: 4 }, explanation: "Q&A pairs are synthesised into a section plan with key points." },
    { activeNodeId: "write",        label: "Write", stateSnapshot: { article_chars: 4990 }, explanation: "Each section is drafted from its key points." },
  ],
  codeSnippets: {
    perspectives: `class _Perspectives(BaseModel):
    perspectives: list[str] = Field(min_length=2, max_length=6,
        description="Distinct viewpoints — not paraphrases")`,
    answer: `def _answer_questions(self, state):
    answers = []
    for item in state["questions"]:
        q = item["question"]
        if self.web_search_fn:
            ctx = "\\n".join(f"- {w[:300]}" for w in self.web_search_fn(q)[:3])
            ans = self.llm.invoke(f"Answer concisely using the web snippets.\\n{ctx}\\nQ: {q}").content
        else:
            ans = self.llm.invoke(f"Answer concisely from your knowledge.\\nQ: {q}").content
        answers.append({"question": q, "answer": ans})
    return {"answers": answers}`,
    outline: `class _OutlineSection(BaseModel):
    title: str
    key_points: list[str]

class _Outline(BaseModel):
    sections: list[_OutlineSection] = Field(min_length=2, max_length=8)`,
  },
};
