import openurl from "better-opn"
import report from "gatsby-cli/lib/reporter"
import formatWebpackMessages from "react-dev-utils/formatWebpackMessages"
import chalk from "chalk"
import { Compiler } from "webpack"

import {
  reportWebpackWarnings,
  structureWebpackErrors,
} from "../utils/webpack-error-utils"

import { printDeprecationWarnings } from "../utils/print-deprecation-warnings"
import { printInstructions } from "../utils/print-instructions"
import { prepareUrls } from "../utils/prepare-urls"
import { startServer } from "../utils/start-server"
import { WebsocketManager } from "../utils/websocket-manager"

export async function startWebpackServer({
  program,
  app,
}): Promise<{
  compiler: Compiler
  websocketManager: WebsocketManager
}> {
  let { compiler, webpackActivity, websocketManager } = await startServer(
    program,
    app
  )

  compiler.hooks.watchRun.tapAsync(`log compiling`, function(_, done) {
    if (webpackActivity) {
      webpackActivity.end()
    }
    webpackActivity = report.activityTimer(`Re-building development bundle`, {
      id: `webpack-develop`,
    })
    webpackActivity.start()

    done()
  })

  let isFirstCompile = true

  return new Promise(resolve => {
    compiler.hooks.done.tapAsync(`print gatsby instructions`, async function(
      stats,
      done
    ) {
      // We have switched off the default Webpack output in WebpackDevServer
      // options so we are going to "massage" the warnings and errors and present
      // them in a readable focused way.
      const messages = formatWebpackMessages(stats.toJson({}, true))
      const urls = prepareUrls(
        program.ssl ? `https` : `http`,
        program.host,
        program.port
      )
      const isSuccessful = !messages.errors.length

      if (isSuccessful && isFirstCompile) {
        printInstructions(
          program.sitePackageJson.name || `(Unnamed package)`,
          urls
        )
        printDeprecationWarnings()
        if (program.open) {
          try {
            await openurl(urls.localUrlForBrowser)
          } catch {
            console.log(
              `${chalk.yellow(
                `warn`
              )} Browser not opened because no browser was found`
            )
          }
        }
      }

      isFirstCompile = false

      if (webpackActivity) {
        reportWebpackWarnings(stats)

        if (!isSuccessful) {
          const errors = structureWebpackErrors(
            `develop`,
            stats.compilation.errors
          )
          webpackActivity.panicOnBuild(errors)
        }
        webpackActivity.end()
        webpackActivity = null
      }

      done()
      resolve({ compiler, websocketManager })
    })
  })
  // "done" event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors, you will get this event.
}
