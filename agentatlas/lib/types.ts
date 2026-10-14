export type ControlFlow = "linear" | "conditional" | "parallel" | "emergent";
export type LoopType = "none" | "fixed" | "reactive" | "iterative" | "bfs" | "mcts";
export type MemoryType =
  | "none"
  | "message_history"
  | "faiss+neo4j"
  | "neo4j"
  | "grid"
  | "vector"          // FAISS store: retrieval corpus, lessons, skills, workflows
  | "tiered"          // MemGPT: bounded context + archival vector store
  | "networkx";       // in-process knowledge graph (GraphRAG)
export type NodeType =
  | "llm"
  | "rule"
  | "tool"
  | "memory"
  | "human"
  | "controller"
  | "start"
  | "end";
export type Paradigm =
  | "reactive"
  | "deliberative"
  | "hybrid"
  | "bdi"
  | "learning"
  | "mas"
  | "emergent";

export type Part = 1 | 2 | 3 | 4 | 5 | 6;

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  description?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  conditional?: boolean;
}

export interface TraceStep {
  activeNodeId: string;
  label: string;
  stateSnapshot: Record<string, unknown>;
  explanation: string;
}

export interface WhenToUseItem {
  useCase: string;
  reason: string;
}

export interface ComparedToItem {
  name: string;
  insight: string;
}

// How a source relates to the architecture:
//   origin         – the work that introduced this pattern
//   related        – a close variant or a paper this implementation borrows from
//   background     – foundational theory the pattern rests on
//   implementation – framework docs / tutorials the code follows
export type ReferenceKind = "origin" | "related" | "background" | "implementation";

export interface Reference {
  kind: ReferenceKind;
  authors: string;      // short form, e.g. "Yao et al."
  year?: number;        // omitted for living docs
  title: string;
  venue?: string;       // e.g. "ICLR 2023", "ACM Computing Surveys 12(2)"
  url?: string;         // arXiv / DOI / docs link; omitted for print-only books
  note?: string;        // how this notebook's implementation relates to the source
}

export interface A1A5Profile {
  a1input: string;
  a2decision: string;
  a3memory: string;
  a4coordination: string;
  a5output: string;
}

export interface Architecture {
  id: string;
  number: number;
  name: string;
  part: Part;
  tagline: string;
  controlFlow: ControlFlow;
  loopType: LoopType;
  memoryType: MemoryType;
  toolUse: boolean;
  llmDriven: boolean;
  llmCallsPerTask: string;
  keyDifferentiator: string;
  paradigm: Paradigm;
  conceptualInsight: string;
  a1a5Profile: A1A5Profile;
  whenToUse: WhenToUseItem[];
  strengths: string[];
  weaknesses: string[];
  comparedTo?: ComparedToItem[];
  references: Reference[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  executionTrace: TraceStep[];
  codeSnippets: Record<string, string>;
  demoInput: string;
  demoOutput: string;
  color: string;
}

export const PART_LABELS: Record<Part, string> = {
  1: "Foundational Single-Agent",
  2: "Multi-Agent Collaboration",
  3: "Advanced Memory & Reasoning",
  4: "Safety & Reliability",
  5: "Learning & Adaptation",
  6: "Retrieval-Augmented Generation",
};

export const PART_COLORS: Record<Part, string> = {
  1: "#6366f1",
  2: "#10b981",
  3: "#f59e0b",
  4: "#ef4444",
  5: "#8b5cf6",
  6: "#0ea5e9",
};

// Single source of truth for iterating parts in the UI (home page, filters).
export const PARTS = Object.keys(PART_LABELS).map(Number) as Part[];

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  llm:        "LLM",
  rule:       "Rule",
  tool:       "Tool",
  memory:     "Memory",
  human:      "Human",
  controller: "Controller",
  start:      "",
  end:        "",
};
