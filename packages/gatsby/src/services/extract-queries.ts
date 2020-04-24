import { IBuildContext } from "../state-machines/develop"

import reporter from "gatsby-cli/lib/reporter"
import { extractQueries as extractQueriesAndWatch } from "../query/query-watcher"
import apiRunnerNode from "../utils/api-runner-node"

export async function extractQueries({
  parentSpan,
}: IBuildContext): Promise<void> {
  const activity = reporter.activityTimer(`onPreExtractQueries`, {
    parentSpan,
  })
  activity.start()
  await apiRunnerNode(`onPreExtractQueries`, {
    parentSpan: activity.span,
    deferNodeMutation: true,
  })
  activity.end()

  await extractQueriesAndWatch({ parentSpan })
}
