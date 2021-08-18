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
