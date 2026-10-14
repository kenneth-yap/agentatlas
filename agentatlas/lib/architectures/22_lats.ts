import { Architecture } from "../types";

export const lats: Architecture = {
  id: "lats",
  number: 22,
  name: "Language Agent Tree Search",
  part: 3,
  tagline: "Monte Carlo tree search over LLM-proposed thoughts",
  controlFlow: "conditional",
  loopType: "mcts",
  memoryType: "none",
  toolUse: false,
  llmDriven: true,
  llmCallsPerTask: "(1 expand + K evaluate) per iteration",
  keyDifferentiator: "Adds three MCTS ingredients to Tree of Thoughts: a real tree with visit counts, UCB1 selection (balancing promising vs under-explored branches), and value backup so a good leaf makes its whole ancestry more attractive.",
  color: "#f59e0b",
  paradigm: "deliberative",
  conceptualInsight: "The explore/exploit trade-off from multi-armed bandits, applied to reasoning. UCB1 = value + c·√(ln N_parent / n_child): unvisited thoughts get infinite priority, rarely-visited ones a bonus — so the search can't get stuck greedily on its first good idea.",
  a1a5Profile: {
    a1input: "Multi-step problem with verifiable steps (e.g. Game of 24)",
    a2decision: "UCB1 (Python) selects a leaf; LLM expands K candidate thoughts; LLM reports booleans; Python composes a 0–10 value",
    a3memory: "Search tree: nodes with parent pointers, visit counts and running-average values",
    a4coordination: "None — single agent; select → expand → evaluate → backup in one node",
    a5output: "Best complete path from root to the highest-value terminal leaf",
  },
  whenToUse: [
    { useCase: "Puzzles and planning with dead ends", reason: "Backup lets the search abandon a branch that looked good early but led nowhere." },
    { useCase: "When greedy beam search fails", reason: "Exploration bonus revisits under-explored branches instead of always expanding the current best." },
    { useCase: "Agent tasks with environment feedback", reason: "The original paper also runs LATS over web navigation and coding tasks." },
  ],
  strengths: [
    "Principled explore/exploit balance (UCB1)",
    "Value backup propagates evidence up the tree",
    "Deterministic value composition gives a non-flat reward signal",
    "Returns an explicit, auditable reasoning path",
  ],
  weaknesses: [
    "Most expensive reasoning pattern here — many LLM calls per iteration",
    "Value depends on LLM self-evaluation booleans",
    "Hyperparameters (c, branching, depth) need tuning",
    "Slow — iterations are sequential",
  ],
  comparedTo: [
    { name: "Tree of Thoughts", insight: "This atlas's ToT is rule-based BFS with no LLM. LATS uses an LLM to propose and evaluate thoughts, and MCTS to decide which branch to grow next." },
    { name: "Self-Consistency", insight: "Self-Consistency samples whole independent paths. LATS grows one tree, sharing prefixes and steering samples toward promising subtrees." },
  ],
  references: [
    { kind: "origin", authors: "Zhou et al.", year: 2024, title: "Language Agent Tree Search Unifies Reasoning, Acting, and Planning in Language Models", venue: "ICML 2024", url: "https://arxiv.org/abs/2310.04406", note: "Keeps MCTS select/expand/evaluate/backup. Omits the paper's self-reflection on failed trajectories and environment interaction — reasoning only." },
    { kind: "related", authors: "Yao et al.", year: 2023, title: "Tree of Thoughts: Deliberate Problem Solving with Large Language Models", venue: "NeurIPS 2023", url: "https://arxiv.org/abs/2305.10601", note: "The BFS/DFS tree search over thoughts that LATS extends with MCTS." },
    { kind: "background", authors: "Kocsis & Szepesvári", year: 2006, title: "Bandit Based Monte-Carlo Planning", venue: "ECML 2006", url: "https://doi.org/10.1007/11871842_29", note: "Introduced UCT — UCB1 applied to tree search — the selection rule used here." },
  ],
  nodes: [
    { id: "start",    type: "start", label: "START",           x: 200, y: 20 },
    { id: "init",     type: "rule",  label: "Init Root",       x: 200, y: 130, description: "Rule: root node = the task; visits=0, value=0" },
    { id: "select",   type: "rule",  label: "UCB1\nSelect",    x: 200, y: 250, description: "Rule: descend from root choosing max(value + c·√(ln N/n)) until a leaf" },
    { id: "expand",   type: "llm",   label: "Expand K\nThoughts", x: 440, y: 250, description: "LLM: proposes K substantively different next moves" },
    { id: "evaluate", type: "llm",   label: "Evaluate\nLeaves", x: 440, y: 390, description: "LLM: booleans (makes_progress, is_complete, avoids_loops) + confidence; Python composes value" },
    { id: "backup",   type: "rule",  label: "Backup",          x: 200, y: 390, description: "Rule: propagate best child value to every ancestor as a running average" },
    { id: "finalize", type: "rule",  label: "Best Path",       x: 200, y: 510, description: "Rule: return path to the highest-value terminal leaf" },
    { id: "end",      type: "end",   label: "END",             x: 200, y: 610 },
  ],
  edges: [
    { id: "e1", source: "start",    target: "init" },
    { id: "e2", source: "init",     target: "select" },
    { id: "e3", source: "select",   target: "expand" },
    { id: "e4", source: "expand",   target: "evaluate" },
    { id: "e5", source: "evaluate", target: "backup" },
    { id: "e6", source: "backup",   target: "select",   label: "iterations left", conditional: true },
    { id: "e7", source: "backup",   target: "finalize", label: "done",            conditional: true },
    { id: "e8", source: "finalize", target: "end" },
  ],
  demoInput: "Game of 24 with [4, 6, 8, 12]: combine all four with + − × ÷, one operation per step, to reach 24.",
  demoOutput: "Best path (value 10/10):\n  12 / 6 = 2   → [8, 4, 2]\n  8 + 4 = 12   → [12, 2]\n  12 × 2 = 24  ✓\n\nTree: 9 nodes, 5 leaves, 4/4 iterations. Leaf values [10, 5, 5, 5, 5] — non-flat, so UCB1 had a real signal to follow.",
  executionTrace: [
    { activeNodeId: "init",     label: "Init", stateSnapshot: { nodes: 1, root: "START. Task: Game of 24 [4, 6, 8, 12]" }, explanation: "The tree starts with just the task as root." },
    { activeNodeId: "select",   label: "Iteration 1 — Select", stateSnapshot: { selected: "root", reason: "only node" }, explanation: "UCB1 descent. Unvisited children score +∞, so every new child gets tried at least once." },
    { activeNodeId: "expand",   label: "Iteration 1 — Expand", stateSnapshot: { candidates: ["12 / 6 = 2; remaining [8, 4, 2]", "8 − 6 = 2; remaining [4, 12, 2]"] }, explanation: "The LLM proposes K=2 different single moves." },
    { activeNodeId: "evaluate", label: "Iteration 1 — Evaluate", stateSnapshot: { makes_progress: true, is_complete: false, avoids_loops: true, confidence: "medium", value: 4.0 }, explanation: "The LLM only answers yes/no questions; Python adds them up (complete +5, progress +2, no loop +1, confidence +0–2). This avoids flat LLM scores." },
    { activeNodeId: "backup",   label: "Iteration 1 — Backup", stateSnapshot: { root_visits: 1, root_value: 4.0 }, explanation: "The best child's value is averaged into each ancestor, so promising subtrees attract future selections." },
    { activeNodeId: "finalize", label: "After 4 iterations", stateSnapshot: { tree_size: 9, best_leaf_value: 10.0, best_path_length: 4 }, explanation: "The terminal leaf '12 × 2 = 24' scored 10/10; its path is returned." },
  ],
  codeSnippets: {
    select: `def _ucb1(self, node, parent_visits):
    if node.visits == 0:
        return float("inf")   # unvisited nodes are infinitely attractive
    exploit = node.value
    explore = self.ucb_c * math.sqrt(math.log(max(parent_visits, 1)) / node.visits)
    return exploit + explore

def _select_leaf(self, nodes, root_id):
    cur = root_id
    while nodes[cur].children_ids:
        children = [nodes[c] for c in nodes[cur].children_ids]
        cur = max(children, key=lambda n: self._ucb1(n, nodes[cur].visits)).id
    return cur`,
    evaluate: `class _LeafEvaluation(BaseModel):
    makes_progress: bool
    is_complete: bool
    avoids_loops: bool
    confidence: str   # 'high' | 'medium' | 'low'

@staticmethod
def _composite_value(f):
    v = 0.0
    if f["is_complete"]:    v += 5.0
    if f["makes_progress"]: v += 2.0
    if f["avoids_loops"]:   v += 1.0
    v += {"high": 2.0, "medium": 1.0, "low": 0.0}[f["confidence"]]
    return min(v, 10.0)`,
    backup: `# propagate the best new child's value up to the root
best = max(nodes[c].value for c in new_child_ids)
for node in path_to_root(leaf_id):
    node.value = (node.value * node.visits + best) / (node.visits + 1)
    node.visits += 1`,
  },
};
