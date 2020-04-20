---
title: Sourcing from Prismic
---
In this guide, you’ll set up a site with content management using [Prismic](https://prismic.io/).
We’ll use the Gatsby Hello World starter.

Prismic is a Headless CMS with a web app for creating and publishing content: the “Writing Room” + a fully-fledged GraphQL API
It’s suitable for marketers and developers as it offers features like a components-based page builder, image optimization, previewing, scheduling, content versioning, and multi-language support.

Interesting reads:

[Sample Blog with API-based CMS & Gatsby.js](https://user-guides.prismic.io/en/articles/2933292-sample-blog-with-api-based-cms-gatsby-js).

[Read the official Prismic documentation on Gatsby](https://prismic.io/docs/reactjs/getting-started/prismic-gatsby).

[Prismic Official documentation](https://prismic.io/docs).


## Setup

### Prismic

Before initializing your Gatsby project you should sign up on [Prismic.io](https://prismic.io/). The free plan is a perfect fit for personal or smaller projects.

Create a new repository and your first Custom type (Repeatable Type) with the name `Post`, then add some fields. Choose rational names for the `API ID` input while configuring a field, these names will appear in your queries. You should always add the `uid` field in order to have a unique identifier (e.g. for filtering). Then switch to the Content overview and create a new Document with your `Post` type. Fill out the fields and publish it.

https://youtu.be/yrOYLNiYtBQ

You can [set your API as private and generate an access token](https://user-guides.prismic.io/en/articles/1036153-generating-an-access-token). In your Prismic repository head over to `Settings → API & Security`, fill out the `Application name` field (the Callback URL can be left empty), and press `Add this application`.

https://youtu.be/iH0P4KcOeVc

### Gatsby

First, open a new terminal window and run the following command to create a new site:

```shell
gatsby new prismic-tutorial https://github.com/gatsbyjs/gatsby-starter-hello-world
```

This will create a new directory called `prismic-tutorial` that contains the starters site, but you can change `prismic-tutorial` in the command above to whatever name you prefer!
Now move into the newly created directory and install the Gatsby plugin for Prismic:

```shell
cd prismic-tutorial
npm install --save gatsby-source-prismic-graphql
```

Also install prismic-reactjs to be able to work with Rich Text fields

```
npm install --save prismic-reactjs
```

If you have a private Prismic API, in addition to installing the Prismic plugin, you also have to install the package `dotenv` to securely use your access tokens locally as you should never commit secret API keys to your repository!

```shell
npm install --save-dev dotenv
```

Create a file called `.env.development` at the root of your project with the following content:

```text
API_KEY=paste-your-secret-access-token-here-wou7evoh0eexuf
```

_Note: If you want to locally build your project you'll also have to create a `.env.production` file with the same content._

Now configure the plugin (See all [available options](https://www.gatsbyjs.org/packages/gatsby-source-prismic-graphql/)). The `repositoryName` is the name you have entered at the creation of the repository (you'll also find it as the subdomain in the URL). 

Add the following to register the plugin, in this example we're dinamically creating pages for all the documents of the type `Post` and one `Homepage`:

```javascript:title=gatsby-config.js
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-prismic-graphql`,
      options: {
        repositoryName: `your-repository-name`,
        accessToken: `${process.env.API_KEY}`,
        pages: [
          {
            type: 'Post',
            match: '/post/:uid',
            path: '/',
            component: require.resolve('./src/templates/post.js')
          },
          {
            type: 'Homepage',
            match: '/:lang',
            path: '/',
            component: require.resolve('./src/templates/home.js')
          }  
        ]
      }
    },
  ],
}
```

The best way to create and test your queries now is to first develop them in the [GraphQL Playground](https://www.gatsbyjs.org/docs/using-graphql-playground/) at `http://localhost:8000/__graphql` and then paste them into your files. Start the local development server and experiment a bit with the available queries.

Because you defined the custom type as `Post` the query after the `prismic` key is called `allPosts` (and `Post`). You can also see the API IDs (from the field names) you created earlier.

With this information you can create your Post templates:

```js:title=src/templates/post.js
import React from "react"
import { graphql } from "gatsby"
import { RichText } from "prismic-reactjs"

export const query = graphql`
  query PostQuery($uid: String) {
    prismic {
      allPosts(uid: $uid){
        edges {
          node {
            _meta {
              uid
            }
            title
            content
          }
        }
      }
    }
  }
`
const Post = props => {
  const prismicContent = props.data.prismic.allPosts.edges[0]
  if (!prismicContent) return null

  const document = prismicContent.node

  return (
    <div>
      <RichText render={document.title} />
      <RichText render={document.content} />
    </div>
  )
}

export default Post
```

## Deploying to Netlify

Earlier you defined an `API_KEY` environment variable for the source plugin. Netlify can set [build environment variables](https://www.netlify.com/docs/continuous-deployment/#build-environment-variables), too. Go to your site and enter the `API_KEY` variable under `Settings → Build & deploy`. This way the source plugin gets the access token passed on the build.

Netlify is able to automatically start builds on pushes to a repository and accepts [webhooks](https://www.netlify.com/docs/webhooks/) to do so. Fortunately, Prismic can [trigger webhook](https://user-guides.prismic.io/webhooks/webhooks) URLs when publishing content. With those features set up, new content will automatically appear on your Netlify site. 

Setup your Netlify project and afterwards go to the `Build hooks` setting at `Settings → Build & deploy`. You'll receive a URL of the format <https://api.netlify.com/build_hooks/-randomstring-> after clicking `Add build hook`. On your Prismic project, visit the `Webhooks` setting and insert the copied URL into the respective field. Confirm with `Add this webhook`. Every time you publish a new document, Netlify will re-build your site.

### Categories

Prismic offers a [Content Relationship](https://user-guides.prismic.io/content-modeling-and-custom-types/field-reference/content-relationship) field which is used to link to another document in your Prismic repository. You can use that in combination with a custom type to create a tagging system (in this example _categories_). And what's cool about that? You can edit your entries any time and they'll update in every post! Read the [official docs](https://user-guides.prismic.io/how-to-guides/create-a-custom-tagging-system) on that or watch the video:

https://youtu.be/67yir-jQrFk

The video shows the usage of a Group field and Content Relationship field — if you only want to have one category, skip the group field. Similar as to the `Post` custom type the `Category` one can also be queried. Furthermore, the `allPosts` query also has the `categories` node available.

The `linkResolver` function is used to process links in your content. Fields with rich text formatting or links to internal content use this function to generate the correct link URL. The document node, field key (i.e. API ID), and field value are provided to the function. This allows you to use different [link resolver logic](https://prismic.io/docs/reactjs/beyond-the-api/link-resolving) for each field if necessary.


### Single Type

When creating a new custom type, you are able to choose `Single Type`, too. Visit your Prismic repository and follow the video:

https://youtu.be/bvDAUEaJXrM

Due to the fact that only one document for that type exists in Prismic anyway. Therefore you need to use `homepage` for your query. This also has the benefit that you don't have to map over an array. Your page could look something like this:

```jsx:title=src/templates/home.js

import React from "react"
import { graphql } from "gatsby"
import { RichText } from "prismic-reactjs"

export const query = graphql`
 query($lang: String!, $uid:String!){
  prismic{
    homepage(lang:$lang, uid:$uid){
      title
      content
    }
  }
 }
`
const Homepage = props => {
  const document = props.data.prismic.homepage
  if (!document) return null

  return (
    <div>
      <RichText render={document.title} />
      <RichText render={document.content} />
    </div>
  )
}

export default Homepage
```

## Wrapping up

This was an example meant to help you understand how Prismic works with Gatsby. With your newfound knowledge of Prismic (and perhaps even Gatsby), you're now able to:

- Create a Prismic repository and setting it up together with the Gatsby plugin
- Query data from Prismic for repeatable and single pages and dynamically generate pages
- Deploy the site in Netlify
- Add Content Relationship links between documents.
