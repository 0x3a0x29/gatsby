import { TransitionConfig, AnyEventObject } from "xstate"
import { IBuildContext } from "./develop"

type BuildTransition = TransitionConfig<IBuildContext, AnyEventObject>

/**
 * Event handler used in all states where we're not ready to process node
 * mutations. Instead we add it to a batch to process when we're next idle
 */
export const ADD_NODE_MUTATION: BuildTransition = {
  actions: `addNodeMutation`,
}

/**
 * Event handler used in all states where we're not ready to process a file change
 * Instead we add it to a batch to process when we're next idle
 */
export const SOURCE_FILE_CHANGED: BuildTransition = {
  actions: `markFilesDirty`,
}

/**
 * When running queries we might add nodes (e.g from resolvers). If so we'll
 * want to re-run queries and schema inference
 */
export const runMutationAndMarkDirty: BuildTransition = {
  actions: [`markNodesDirty`, `callApi`],
}
