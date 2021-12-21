# Microfrontends with React

## The Basics of Microfrontends

### What is a Microfrontend

#### What are microfrontends ?

- Divide a monolithic app into multiple, smaller apps
- Each smaller app is responsible for a distinct feature of the product

#### Why use the ?

- Multiple engineering teams can work is isolation
- Each smaller app is easier to understand and make changes to

### Container

Decides when / where to show each Microfrontend

MFE Container

- MFE #1: ProductsList
- MFE #2: Cart

**Integration**: How and when does Container get access to the source code in MFE #1 and #2?

- There is no single perfect solution to integration
- Many solutions, each have pros and cons
- Look at what your requirements are, then pick a solution

### Major Categories of Integration

### Build-Time Integration

> Compile-Time Integration

**Before** Container gets loaded in the browser, it gets access to ProductList source code

1. Engineering team develops ProductList
2. Time to deploy!
3. **Publish ProductList as an NPM package => NPM Registry**
4. Team in charge of Container installs ProductList as a dependency
5. Container team builds their app
6. Output bundle that includes all the code for ProductsList

##### Pro

- Easy to setup and understand!

##### Cons

- Container has to be re-deployed every time ProductList is updated
- Tempting to tightly couple the Container + ProductList together

### Run-Time Integration

> Client-Side Integration

**After** Container gets loaded in the browser, it gets access to ProductList source code

1. Engineering team develops ProductList
2. Time to deploy!
3. ProductList code deployed at `https://my-app.com/productlist.js`
4. User navigates to my-app.com, Container app is loaded
5. Container app fetches productlist.js and executes it

##### Pro

- ProductList can be deployed independently at any time
- Different versions of ProductList can be deployed and Container can decide which one to use

##### Cons

- Tooling + setup is far more complicated

### Server Integration

While sending down JS to load up Container, a server decides on whether or not to include ProductList source

This project is focused on **Run-Time Integration** using **Webpack Module Federation**

- Hardest to setup + understand - makes sense to cover in in great detail!
- Most flexible and performant solution around right now
- Focus on Webpack and how it works

---

## Module federation Process

- Designate one app as the Host(CONTAINER) and on as the Remote(PRODUCTS)
- In the Remote, decide which modules(files) you want to make available to other projects
- Set up Module Federation plugin to _expose_ those files
- In the Host, decide which files you want to get from the remote
- Set up Module Federation plugin to fetch those files
- In the Host, refactor the entry point to load asynchronously
- In the Host, import whatever files you need from the remote

## Sharing Dependencies between Apps

### Using Shared Modules

It is the Module Federation Plugin that is injecting or adding code

- Container fetches Products remoteEntry.js file
- Container fetches Cart remoteEntry.js file
- Container notices that both require Faker!
- Container can choose to load only one copy from either Cart or Products
- Single copy is made available to both Cart + Products

```
    new ModuleFederationPlugin({
      name: "cart",
      filename: "remoteEntry.js",
      exposes: {
        "./CartShow": "./src/index",
      },
      shared: ["faker"],
    }),
```

Only loading one single copy of faker

### Async Script Loading

If a MF has a shared dependency then it can't run by it's own unless we have async script loading

By using the **bootstrap** file like in container, we give webpack the opportunity to take a look at what files this code requires to run

`products/src/index.js`

```
import('./bootstrap')
```

> Gives the ability to webpack to asynchronously load up the bootstrap JS file

### Shared Module Versioning

If 2 MFs have different versions of the same module, then both modules will be fetched - not the same.

The Module Federation Plugin will take a look at the versions you specify in `package.json`

If the have the same major version (e.g. 5.0.0 and 5.1.0 - both starting with 5 = major)

### Singleton Loading

In some scenarios, we don't want to load different copies of a module, because if we do we get an error - like react library.

If I have singleton option, and 2 different major versions in the to MFs I get a warning message: Unsatisfied shared singleton module

```
shared: {
  faker: {
    singleton: true
  }
}
```

### Sub-App Execution Context

We should be able

- to develop each project in isolation
- to run each project in the context of the container

Products and Cart `index.html` file is only used during **development**

Container's `index.html` is used during **development + production**

Container Team might does not have an `#id` of `dev-products` in their `index.html` file

### Solution

`container/src/bootstrap.js`

```
import { mount as productsMount } from "products/ProductsIndex";
import { mount as cartMount } from "cart/CartShow";

productsMount(document.querySelector("#my-products"));
cartMount(document.querySelector("#my-cart"));

```

`container/webpack.config.js`

```
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  mode: "development",
  devServer: {
    port: 8080,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "container",
      remotes: {
        products: "products@http://localhost:8081/remoteEntry.js",
        cart: "cart@http://localhost:8082/remoteEntry.js",
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};

```

`products/src/bootstrap.js`

```
import faker from "faker";

const mount = (el) => {
  let products = "";

  for (let i = 0; i < 5; i++) {
    const name = faker.commerce.productName();

    products += `<div>${name}</div>`;
  }

  el.innerHTML = products;
};

if (process.env.NODE_ENV === "development") {
  const el = document.querySelector("#dev-products");
  if (el) {
    mount(el);
  }
}

export { mount };
```

### A little Gotcha

If I print the `cart` variable in console, I get a global variable from remoteEntry's - file - cart.

If I change `container/src/bootstrap` to

```
cartMount(document.querySelector("#cart"));
```

and `container/public/index.html` to

```
<div id="cart"></div>
```

I get error

> TypeError: fn is not a function

and if I type the cart variable I get a reference to that div

```
<div id="cart"></div>
```

> If your ever assign an id to an element, your browser is going to try to create a new global variable, with the same exact name as the ID.

> Overwrites the cart global variable that gets defined inside the remoteEntry file
> sa

## Linking Multiple Apps Together

### Application overview

Group the pages of the app depending on their functionality:

**Marketing**

- Home Page
- Pricing Page

**Authentication**

- Sign In Page
- Sign Up Page

**Dashboard**

- Dashboard Page

### Tech Stack

Container: React

- Marketing: React
- Authentication: React
- Dashboard: Vue

Integration techniques are identical

### Requirements

Inflexible Requirement # 1

- **Zero coupling between child projects**
- No importing of functions/objects/classes/etc
- No shared state
- Shared libraries through MF is ok

Inflexible Requirement # 2

- **Near-zero coupling between container and child apps**
- Container shouldn't assume that a child is using a particular framework
- Any necessary communication done with callbacks or simple events

Inflexible Requirement # 3

- **CSS from one project shouldn't affect another**

Inflexible Requirement # 4

- **Version control (monorepo vs separate) shouldn't have any impact on the overall project**
- Some people want to use monorepos
- Some people want to keep everything in a separate repo

Inflexible Requirement # 5

- **Container should be able to decide to always use the latest version of a microfrontend or specify a specific version**
- Container will always use the latest version of a child app (doesn't require a redeploy of container)
- Container can specify exactly what version of a child it wants to use (requires a redeploy to change)

### Why Import the Mount Function.

Why not export the Marketing as a React component (as Container uses React and import it) instead we export the mount function ?

Due to Inflexible Requirement #2

- Near-zero coupling between container and child apps
- Container **shouldn't assume** that a child is using **a particular framework**

All coupling should be as generic as possible

### Generic coupling

React Container

```
import { mount } from "marketing/MarketingApp";
import React, { useRef, useEffect } from "react";

export default () => {
  const ref = useRef(null);

  useEffect(() => {
    mount(ref.current);
  });

  return <div ref={ref} />;
};

```

### Delegating Shared Module

How to avoid duplication of shared modules in every MF ?

Delegate to Webpack

(works even with newly installed packages and updates)

In some cases though, specific versions of packages might be neccesary.

In `webpack.dev.js` of each MF

- require package.json literal

```
const packageJson = require("../package.json");

```

- use depencies in shared modules

```
  plugins: [
    new ModuleFederationPlugin({
      name: "container",
      remotes: {
        marketing: "marketing@http://localhost:8081/remoteEntry.js",
      },
      shared: packageJson.dependencies,
    }),
```

## Implementing a CI/CD Pipeline

### Requirements Around Deployment

- Want to deploy each microfrontend independently (including the container)

- Location of child app remoteEntry.js files must be knwon at **build time** (marketing@http://localhost:8081/remoteEntry.js)!

- Many front-end deployment solutions assume you're deploying a single project - we need something that can handle multiple different ones

- Probably need a CI/CD pipeline of some sort

- At present, the remoteEntry.js file name is fixed! Need to think about caching issues

It is way more common for you to queue up a process - or have some outside process - for deployment.

### Path to Production

Git Monorepo -->

Did container (or marketing etc..) change ? -->

Build a production container with webpack -->

Upload to Amazon S3 -->

Use Amazon CloudFront to serve files from S3

### Workflow For Deploying Container

Whenever code is pushed to the master/main branch

and

this commit contains a change to the 'container' folder

#### Commands executed in a virtual machine hosted by Github

- Change into the container folder

- Install dependencies

- Create a production build using webpack

- Upload the result to AWS S3

### YML file example

Inside the hidden folder `.github/workflows` in root directory:

```
name: deploy-container

on:
  push:
    branches:
      - master
    paths:
      - "packages/container/**"

defaults:
  run:
    working-directory: "packages/container"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build

      - uses: chrislennon/action-aws-cli@v1.1
      - run: aws s3 sync dist s3://${{ secrets.AWS_S3_BUCKET_NAME }}/container/latest
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

```

## Deployment to AWS

### Bucket setup

- Create bucket in S3

Go to Properties Tab:

- Static website hosting -> Enable
- Index document: index.html We won't have it in the root of the bucket but is going to be overriden
- Error document: index.html

Go to Permissions Tab of bucket:

- Uncheck block all public access

### Bucket policy

- Edit -> Policy generator
  To allow cloudfront distribution to access s3 files

- Policy Type: S3 Bucket Policy
- Effect: Allow
- Principal: \*
- Actions: GetObject
- ARN: Bucket ARN

Adding at the end of Bucket ARN: /\*

ARN the name of the bucket that we want cloudfront to have access to

### Cloudfront Distribution

- Cloudfront -> Create Distribution -> Web

- Origin name: select s3 bucket

Default cache behavior:

- Redirect HTTP to HTTPS

Distribution Settings:
To have a custom domain with certificate

- Custom SSL Certificate

#### A bit more configuration

- Click on General of distribution
- Default Root Object: `/container/latest/index.html`

- Error Pages tab
- HTTP Error Code: 403 Forbidden
- Customize Error Response: Yes
- Response Page Path: `/container/latest/index.html`
- HTTP Response Code: 200 OK

### Creating and Assigning Access Keys

Create 3 environment variables, first generate an access keys:

- Search for **IAM** -> Users -> Add user -> mfe-github-action
- Access type: Programmatic access
- Permissions: AmazonS3FullAccess, CloudfrontFullAccess
- Copy in the settings of Github repository

Setup secrets: values that we can only access inside github actions

- Github repo -> Settings -> Secrets -> Create
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_BUCKET_NAME

### Fixing absolute path error

`webpack.prod`

```
const prodConfig = {
  mode: "production",
  output: {
    filename: "[name].[contenthash].js",
    publicPath: "/container/latest/",
  },
```

Whenever our html plugin starts to figure out all the different script tags it needs to add it will prepend them with the publicPath
