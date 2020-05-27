const fs = require(`fs-extra`)
const path = require(`path`)
const { store } = require(`../redux`)

const fixedPagePath = pagePath => (pagePath === `/` ? `index` : pagePath)

const getFilePath = ({ publicDir }, pagePath) =>
  path.join(publicDir, `page-data`, fixedPagePath(pagePath), `page-data.json`)

const read = async ({ publicDir }, pagePath) => {
  const filePath = getFilePath({ publicDir }, pagePath)
  const rawPageData = await fs.readFile(filePath, `utf-8`)
  return JSON.parse(rawPageData)
}

const remove = async ({ publicDir }, pagePath) => {
  const filePath = getFilePath({ publicDir }, pagePath)
  if (fs.existsSync(filePath)) {
    return await fs.remove(filePath)
  }
  return Promise.resolve()
}

const writePageData = async (
  { publicDir },
  page,
  { staticQueryHashes, moduleDependencies }
) => {
  const inputFilePath = path.join(
    publicDir,
    `..`,
    `.cache`,
    `json`,
    `${page.path.replace(/\//g, `_`)}.json`
  )
  const outputFilePath = getFilePath({ publicDir }, page.path)
  const result = await fs.readJSON(inputFilePath)
  const body = {
    componentChunkName: page.componentChunkName,
    path: page.path,
    matchPath: page.matchPath,
    moduleDependencies: moduleDependencies,
    result,
    staticQueryHashes,
  }
  const bodyStr = JSON.stringify(body)
  // transform asset size to kB (from bytes) to fit 64 bit to numbers
  const pageDataSize = Buffer.byteLength(bodyStr) / 1000

  store.dispatch({
    type: `ADD_PAGE_DATA_STATS`,
    payload: {
      filePath: outputFilePath,
      size: pageDataSize,
    },
  })

  await fs.outputFile(outputFilePath, bodyStr)

  return body
}

const flush = async () => {
  const {
    pendingPageDataWrites,
    components,
    pages,
    staticQueriesByTemplate,
    program,
  } = store.getState()

  console.log({
    pendingPageDataWrites,
  })

  const { pagePaths, templatePaths } = pendingPageDataWrites

  const pagesToWrite = Array.from(templatePaths).reduce(
    (set, componentPath) => {
      const { pages } = components.get(componentPath)
      pages.forEach(set.add.bind(set))
      return set
    },
    new Set(pagePaths.values())
  )

  for (const pagePath of pagesToWrite) {
    const page = pages.get(pagePath)
    await writePageData(
      { publicDir: path.join(program.directory, `public`) },
      page,
      {
        staticQueryHashes: staticQueriesByTemplate.get(page.componentPath),
      }
    )
    console.log({ pagePath })
  }

  store.dispatch({
    type: `CLEAR_PENDING_PAGE_DATA_WRITES`,
  })

  return
}

module.exports = {
  read,
  writePageData,
  remove,
  fixedPagePath,
  flush,
}
