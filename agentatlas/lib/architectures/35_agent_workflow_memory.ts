import { Architecture } from "../types";

export const agentWorkflowMemory: Architecture = {
  id: "agent-workflow-memory",
  number: 35,
  name: "Agent Workflow Memory",
  part: 5,
  tagline: "Mine reusable recipes from solved tasks; follow them next time",
  controlFlow: "linear",
  loopType: "none",
  memoryType: "vector",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "2 (answer + extract workflow)",
  keyDifferentiator: "After every task the agent abstracts what it did into a 3–6 step, entity-free workflow and stores it. New tasks retrieve the most similar workflow and follow it as a prior, instead of solving from scratch.",
  color: "#8b5cf6",
  paradigm: "learning",
  conceptualInsight: "Learning at the strategy level. Voyager remembers code (how to compute), Reflexion remembers mistakes (what not to do), AWM remembers procedures (in what order to work) — three kinds of memory for three kinds of transfer.",
  a1a5Profile: {
    a1input: "Task in a recurring family (e.g. summarise + categorise a snippet)",
    a2decision: "Vector retrieval of the top workflow; LLM answers following it; LLM extracts a new workflow afterwards",
    a3memory: "Workflow library {task_type, steps[]} indexed by embedding; persists across run() calls",
    a4coordination: "None — retrieve → answer → extract",
    a5output: "Answer plus an updated workflow library",
  },
  whenToUse: [
    { useCase: "Repetitive task families (support tickets, triage, data entry)", reason: "A proven procedure transfers across instances with different entities." },
    { useCase: "Web or UI agents", reason: "The paper shows large gains on web-navigation benchmarks from reused routines." },
    { useCase: "Onboarding an agent to a new domain", reason: "The library becomes readable documentation of how the agent works." },
  ],
  strengths: [
    "Transfers strategy, not just facts",
    "Workflows are human-readable",
    "Cheap: 2 calls per task",
    "Library improves with use",
  ],
  weaknesses: [
    "No success check: workflows are extracted even from wrong answers",
    "Near-duplicate workflows accumulate (demo: 3 workflows for 1 task family)",
    "A poor workflow can mislead later tasks",
    "Retrieval picks only the top-1 workflow",
  ],
  comparedTo: [
    { name: "Voyager", insight: "Voyager stores executable code; AWM stores natural-language procedures." },
    { name: "Reflexion", insight: "Reflexion stores lessons from failures; AWM stores recipes from completed tasks." },
  ],
  references: [
    { kind: "origin", authors: "Wang, Mao, Fried & Neubig", year: 2025, title: "Agent Workflow Memory", venue: "ICML 2025", url: "https://arxiv.org/abs/2409.07429", note: "The paper induces workflows from successful trajectories, offline or online. This notebook extracts after every task without checking success." },
    { kind: "related", authors: "Wang et al.", year: 2023, title: "Voyager: An Open-Ended Embodied Agent with Large Language Models", venue: "arXiv preprint", url: "https://arxiv.org/abs/2305.16291", note: "Skill library of code — the procedural-memory sibling of AWM's workflow library." },
  ],
  nodes: [
    { id: "start",    type: "start",  label: "START",            x: 200, y: 20 },
    { id: "retrieve", type: "memory", label: "Retrieve\nWorkflow", x: 200, y: 140, description: "Memory: top-1 workflow by task similarity (none if library empty)" },
    { id: "answer",   type: "llm",    label: "Answer\n(follow recipe)", x: 200, y: 280, description: "LLM: solve the task following the retrieved steps, or from scratch" },
    { id: "extract",  type: "llm",    label: "Extract\nWorkflow",  x: 200, y: 420, description: "LLM: task_type + 3–6 generalisable steps; stored in the library" },
    { id: "end",      type: "end",    label: "END",              x: 200, y: 540 },
  ],
  edges: [
    { id: "e1", source: "start",    target: "retrieve" },
    { id: "e2", source: "retrieve", target: "answer" },
    { id: "e3", source: "answer",   target: "extract" },
    { id: "e4", source: "extract",  target: "end" },
  ],
  demoInput: "Three snippets in sequence, each: 'Summarise in one sentence, then categorise (news/opinion/research)'. Octopus REM-sleep study → urban-planning rules op-ed → Congress passes infrastructure bill.",
  demoOutput: "Task 1: no workflow → solved from scratch → \"…categorised as research.\"  library 0 → 1\nTask 2: reused 'text_summarization_and_categorization' → \"…which is an opinion.\"  library 1 → 2\nTask 3: reused it again → \"…which is a news article.\"  library 2 → 3\n\nAll three categories correct. The library grew to 3 near-duplicate workflows for one task family.",
  executionTrace: [
    { activeNodeId: "retrieve", label: "Task 2 — Retrieve", stateSnapshot: { library_size: 1, matched_workflow: "text_summarization_and_categorization" }, explanation: "The workflow extracted after task 1 is the nearest match." },
    { activeNodeId: "answer",   label: "Answer with recipe", stateSnapshot: { used_workflow: true, steps: ["Read and understand the text", "Identify main topic", "Summarise in one sentence", "Determine the category", "Combine summary and category"] }, explanation: "The recipe is injected into the prompt as a prior." },
    { activeNodeId: "extract",  label: "Extract", stateSnapshot: { extracted_type: "text_classification", library_size: 2 }, explanation: "A new, slightly different workflow is stored. With no deduplication or success check, the library accumulates near-duplicates." },
  ],
  codeSnippets: {
    retrieve: `def _retrieve(self, state):
    if not self.workflows:
        return {"retrieved_workflow": None}
    docs = self._index.search(state["task"], k=1)
    label = docs[0].metadata.get("task_type", "") if docs else ""
    wf = next((w for w in self.workflows if w["task_type"] == label), None)
    return {"retrieved_workflow": wf}`,
    answer: `def _answer(self, state):
    wf = state.get("retrieved_workflow")
    if wf:
        steps = "\\n".join(f"  {i+1}. {s}" for i, s in enumerate(wf["steps"]))
        prompt = (f"# Task\\n{state['task']}\\n"
                  f"# Reusable workflow recipe (type='{wf['task_type']}')\\n{steps}\\n"
                  "Follow this recipe to solve the task. Output JUST the final answer.")
    else:
        prompt = f"# Task\\n{state['task']}\\nSolve from scratch. Output JUST the final answer."
    return {"answer": self._answerer.invoke(prompt).answer.strip()}`,
    extract: `class _Workflow(BaseModel):
    task_type: str
    steps: list[str] = Field(min_length=2, max_length=8,
        description="Generalisable — no task-specific entities, just the strategy")`,
  },
};
