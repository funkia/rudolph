<img align="right" src="https://avatars0.githubusercontent.com/u/21360882?v=3&s=200">

# Rudolph
A pure and functional router using classic FRP. Written in TypeScript.
Experimental.

[![Build Status](https://travis-ci.org/funkia/rudolph.svg?branch=master)](https://travis-ci.org/funkia/rudolph)
[![codecov](https://codecov.io/gh/funkia/rudolph/branch/master/graph/badge.svg)](https://codecov.io/gh/funkia/rudolph)


## Install
```
npm install --save @funkia/rudolph @funkia/hareactive
```

## API

### Router

```ts
type Router = {
  prefixPath: string;
  path: Behavior<string>;
  useHash: boolean;
};
```

### createRouter

Takes a configuration Object describing how to handle the routing:

* `useHash: boolean` - whether to use hash-routing
* `path: Behavior<string>` - defaults to `locationHashB` or `locationB`

It errors if `useHash = true` but hash-routing is unsupported in that browser, or if there is no support for the history API.

The returned Router object is identical to its input, augmented with `prefixPath: ""`, which is used to nest routers.

Usage:

```ts
const router = createRouter({
  useHash: false
});

runComponent("#mount", main({ router }));
```

### navigate

```ts
navigate(router: Router, pathStream: Stream<string>): Now<Stream<any>>
```

`navigate` takes a stream of paths. Whenever the stream has an occurence, it is navigated to.

Usage:

```ts
const navs: Stream<string> = userIds
  .map(prefix("/user/"))
  .combine(on.homeClicks.mapTo("/"));

start(navigate(props.router, navs));
```

### routePath

`routePath<A>(routes: Routes<A>, router: Router): Behavior<A>`

Takes a description of the routes and a router, and returns a behavior with the result of parsing the router's location according to the routes' pattern.

The first parameter, `routes: Routes`, is a description of the routes, in the form:

```ts
{"/route/:urlParam"; (restUrl, params) => result}
```

Usage:

```ts
E.section(
  routePath(
    {
      "/user/:userId": (_subrouter, { userId }) => user(userId),
      "/": () => home,
      "*": () => notFound,
    },
    props.router
  )
)
```

### Routes

```ts
type Routes<A> = Record<string, RouteHandler<A>>
```

Example:

```ts
{
  "/user/:userId": (_subrouter, { userId }) => user(userId),
  "/": () => home,
  "*": () => notFound,
}
```

### RouteHandler

```ts
type RouteHandler<A> = (
  router: Router,
  params: Record<string, string>
) => A;
```

### locationHashB

`locationHashB: Behavior<string>` represents the current values of the URL hash.

### locationB

`locationHashB: Behavior<string>` represents the current values of the URL pathname.

### navigateHashIO

`navigateHashIO: (path: string) => IO<void>` is an `IO` effect that updates the URL hash to the supplied argument.

### navigateIO

`navigateIO: (path: string) => IO<void>` is an `IO` effect that updates the URL pathname to the supplied argument.

### warnNavigation

Takes a behavior of a boolean, if true the user will have to confirm before unloading page.
