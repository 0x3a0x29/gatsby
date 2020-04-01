const reporter = require(`gatsby-cli/lib/reporter`)
import { createSchemaCustomization } from "../utils/create-schema-customization"
import { IBuildContext } from "../state-machines/develop"

export async function customizeSchema({
  parentSpan,
  refresh,
  webhookBody,
}: IBuildContext): Promise<any> {
  const activity = reporter.activityTimer(`createSchemaCustomization`, {
    parentSpan,
  })
  activity.start()
  await createSchemaCustomization({
    parentSpan,
    refresh,
    webhookBody,
  })
  activity.end()
}
