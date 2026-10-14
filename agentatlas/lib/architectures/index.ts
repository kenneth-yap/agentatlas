import { Architecture } from "../types";
import { reflection } from "./01_reflection";
import { toolUse } from "./02_tool_use";
import { react } from "./03_react";
import { planning } from "./04_planning";
import { multiAgent } from "./05_multi_agent";
import { pev } from "./06_pev";
import { blackboard } from "./07_blackboard";
import { episodicSemantic } from "./08_episodic_semantic";
import { treeOfThoughts } from "./09_tree_of_thoughts";
import { simulator } from "./10_simulator";
import { metaController } from "./11_meta_controller";
import { graphMemory } from "./12_graph_memory";
import { ensemble } from "./13_ensemble";
import { dryRun } from "./14_dry_run";
import { rlhf } from "./15_rlhf";
import { cellularAutomata } from "./16_cellular_automata";
import { metacognitive } from "./17_metacognitive";
import { reflexion } from "./18_reflexion";
import { selfDiscover } from "./19_self_discover";
import { chainOfVerification } from "./20_chain_of_verification";
import { selfConsistency } from "./21_self_consistency";
import { lats } from "./22_lats";
import { agenticRag } from "./23_agentic_rag";
import { correctiveRag } from "./24_corrective_rag";
import { selfRag } from "./25_self_rag";
import { adaptiveRag } from "./26_adaptive_rag";
import { graphRag } from "./27_graph_rag";
import { debate } from "./28_debate";
import { voyager } from "./29_voyager";
import { storm } from "./30_storm";
import { memgpt } from "./31_memgpt";
import { constitutionalAi } from "./32_constitutional_ai";
import { sweAgent } from "./33_swe_agent";
import { computerUse } from "./34_computer_use";
import { agentWorkflowMemory } from "./35_agent_workflow_memory";

export const architectures: Architecture[] = [
  reflection,
  toolUse,
  react,
  planning,
  multiAgent,
  pev,
  blackboard,
  episodicSemantic,
  treeOfThoughts,
  simulator,
  metaController,
  graphMemory,
  ensemble,
  dryRun,
  rlhf,
  cellularAutomata,
  metacognitive,
  reflexion,
  selfDiscover,
  chainOfVerification,
  selfConsistency,
  lats,
  agenticRag,
  correctiveRag,
  selfRag,
  adaptiveRag,
  graphRag,
  debate,
  voyager,
  storm,
  memgpt,
  constitutionalAi,
  sweAgent,
  computerUse,
  agentWorkflowMemory,
];

export function getArchitecture(id: string): Architecture | undefined {
  return architectures.find((a) => a.id === id);
}
