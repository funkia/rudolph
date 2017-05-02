import { withEffects } from "@funkia/jabz";
import {
  Behavior, Now, Stream,
  streamFromEvent,
  behaviorFromEvent,
  performStream,
  performStreamOrdered,
  snapshotWith
} from "@funkia/hareactive";

export type ParamBehavior = Behavior<Record<string, string>>;

const supportHistory = "history" in window && "pushState" in window.history;
const supportHash = "onhashchange" in window;

function fst<A>(arr: A[]): A;
function fst(arr: string): string;
function fst<A>(arr: A[] | string): A | string {
  return arr[0];
}

function takeUntilRight(stop: string, str: string): string {
  return str.substr(str.indexOf(stop) + 1);
}

export type Router = {
  prefixPath: string,
  path: Behavior<string>,
  useHash: boolean
};

/**
 * Takes a configuration Object describing how to handle the routing.
 * @param config An Object containing the router basic router configurations.
 */
export function createRouter({
  useHash = false,
  path = useHash ? locationHashB : locationB
}: Partial<Router>): Router {
  if (useHash && !supportHash) {
    throw new Error("No support for hash-routing.");
  } else if (!supportHistory) {
    throw new Error("No support for history API.");
  }
  return {
    prefixPath: "",
    path,
    useHash
  };
}

// locationHashB: Behavior<string> - string of location.hash
export const locationHashB = behaviorFromEvent(window, "hashchange",
takeUntilRight("#", window.location.hash) || "/", evt => takeUntilRight("#", evt.newURL));

// locationB
export const locationB = behaviorFromEvent(window, "popstate", window.location.pathname, evt => window.location.pathname);

const navigateHashIO = withEffects((path: string) => { window.location.hash = path; });
const navigateIO = withEffects((path: string) => {
  locationB.push(path);
  window.history.pushState({}, "", path);
});

/**
 * Takes a stream of Paths. Whenever the stream has an occurrence it is
 * navigated to.
 * @param pathStream A stream of paths.
 */
export function navigate(router: Router, pathStream: Stream<string>): Now<Stream<any>> {
  const newUrl = pathStream.map(path => router.prefixPath + path);
  const navigateFn = router.useHash ? navigateHashIO : navigateIO;
  return performStreamOrdered(newUrl.map(navigateFn));
}

type ParsedPathPattern<A> = {
  path: string[];
  params: Record<string, number>;
  length: number;
  handler: Handler<A>
};

type Handler<A> = (router: Router, params: Record<string, string>) => A;

function parsePathPattern<A>(pattern: string, handler: Handler<A>): ParsedPathPattern<A> {
  const patternParts = pattern.split("/");
  const p: ParsedPathPattern<A> = {
    path: [],
    params: {},
    length: patternParts.length,
    handler
  };
  if (pattern === "*") {
    return p;
  }
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (fst(part) === ":") {
      p.params[part.substr(1)] = i;
    } else {
      p.path[i] = part;
    }
  }
  return p;
}

export type Routes<A> = Record<string, Handler<A>>;

/**
 * Takes a description of the routes, a behavior of the current location and returns a
 * behavior with the result of parsing the location according to the pattern.
 * @param routes A description of the routes, in the form {"/route/:urlParam"; (restUrl, params) => result}
 * @param locationBehavior A behavior describing the current location.
 */
export function routePath<A>(routes: Routes<A>, router: Router): Behavior<A> {
  const parsedRoutes = Object.keys(routes).map((path) => parsePathPattern(path, routes[path]));

  return router.path.map((location) => {
    const locationParts = location.split("/");
    const match = parsedRoutes.find(({ path }: ParsedPathPattern<A>) => path.every((part, index) => {
      return part === locationParts[index];
    }));

    const rest = "/" + locationParts.slice(match.length).join("/");
    const matchedPath = locationParts.slice(0, match.length).join("/");
    const newRouter: Router = {
      prefixPath: router.prefixPath + matchedPath,
      path: Behavior.of(rest),
      useHash: router.useHash
    };
    let params: Record<string, string> = {};
    for (const key of Object.keys(match.params)) {
      params[key] = locationParts[match.params[key]];
    }
    return match.handler(newRouter, params);
  });
}

export const beforeUnload = streamFromEvent(window, "beforeunload");

const preventNavigationIO = withEffects((event: WindowEventMap["beforeunload"], shouldWarn: boolean) => {
  if (shouldWarn) {
    event.returnValue = "\o/";
    return "\o/";
  }
});

/**
 * Takes a behavior of a boolean, if true the user will have to confirm before unloading page.
 * @param shouldWarnB A behavior of a boolean
 */
export function warnNavigation(shouldWarnB: Behavior<boolean>): Now<Stream<string>> {
  const a = snapshotWith(preventNavigationIO, shouldWarnB, beforeUnload);
  return performStream(a);
}
