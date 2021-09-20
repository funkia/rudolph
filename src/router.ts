import { withEffects } from "@funkia/io";
import {
  Behavior,
  Now,
  Stream,
  performStream,
  snapshotWith,
  SinkBehavior,
  flatFuturesOrdered
} from "@funkia/hareactive";
import { streamFromEvent, behaviorFromEvent } from "@funkia/hareactive/dom";

export type ParamBehavior = Behavior<Record<string, string>>;

function fst<A>(arr: A[]): A;
function fst(arr: string): string;
function fst<A>(arr: A[] | string): A | string {
  return arr[0];
}

function takeUntilRight(stop: string, str: string): string {
  return str.substr(str.indexOf(stop) + 1);
}

function isEqual(obj1: any, obj2: any): boolean {
  return Object.keys(obj1).every(
    (key) => key in obj2 && obj1[key] === obj2[key]
  );
}

export type Router = {
  prefixPath: string;
  path: Behavior<string>;
  useHash: boolean;
};

/**
 * Takes a configuration Object describing how to handle the routing.
 * @param config An Object containing the router basic router
 * configurations.
 */
export function createRouter({
  useHash = false,
  path = useHash ? locationHashB : locationB
}: Partial<Router>): Router {
  const supportHistory = "history" in window && "pushState" in window.history;
  const supportHash = "onhashchange" in window;
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

export const locationHashB = behaviorFromEvent<string, "hashchange", Window>(
  window,
  "hashchange",
  (w) => takeUntilRight("#", w.location.hash) || "/",
  (evt) => takeUntilRight("#", evt.newURL)
);

export const locationB = behaviorFromEvent(
  window,
  "popstate",
  (w) => w.location.pathname,
  (_e) => window.location.pathname
);

const navigateHashIO = withEffects((path: string) => {
  window.location.hash = path;
});
const navigateIO = withEffects((path: string) => {
  (<SinkBehavior<string>>locationB).newValue(path);
  window.history.pushState({}, "", path);
});

/**
 * Takes a stream of paths. Whenever the stream has an occurrence it
 * is navigated to.
 * @param pathStream A stream of paths.
 */
export function navigate(
  router: Router,
  pathStream: Stream<string>
): Now<Stream<any>> {
  const newUrl = pathStream.map((path) => router.prefixPath + path);
  const navigateFn = router.useHash ? navigateHashIO : navigateIO;
  return performStream(newUrl.map(navigateFn));
}

type ParsedPathPattern<A> = {
  path: string[];
  params: Record<string, number>;
  length: number;
  handler: RouteHandler<A>;
};

export type RouteHandler<A> = (
  router: Router,
  params: Record<string, string>
) => A;

function parsePathPattern<A>(
  pattern: string,
  handler: RouteHandler<A>
): ParsedPathPattern<A> {
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

export type Routes<A> = Record<string, RouteHandler<A>>;

/**
 * Takes a description of the routes, and a router
 * and returns a behavior with the result of parsing the
 * location according to the pattern.
 * @param routes A description of the routes, in the form
 * {"/route/:urlParam"; (restUrl, params) => result}
 */
export function routePath<A>(routes: Routes<A>, router: Router): Behavior<A> {
  const parsedRoutes = Object.keys(routes).map((path) =>
    parsePathPattern(path, routes[path])
  );
  let lastMatch: ParsedPathPattern<A> | undefined;
  let result: A;
  let lastParams: Record<string, string>;
  let lastRouter: Router;
  return router.path.map((location) => {
    const locationParts = location.split("/");
    const match = parsedRoutes.find(({ path }: ParsedPathPattern<A>) =>
      path.every((part, index) => {
        return part === locationParts[index];
      })
    )!;


    const params = Object.keys(match.params).reduce<Record<string,string>>((paramsAcc, key) => {
      paramsAcc[key] = locationParts[match.params[key]];
      return paramsAcc;
    }, {});

    if (match !== lastMatch) {
      lastMatch = match;
      // const rest = "/" + locationParts.slice(match.length).join("/");
      const matchedPath = locationParts.slice(0, match.length).join("/");

      const newRouter: Router = {
        prefixPath: router.prefixPath + matchedPath,
        path: router.path.map((l) => l.slice(matchedPath.length)),
        useHash: router.useHash
      };

      lastParams = params;
      lastRouter = newRouter;
      result = match.handler(newRouter, params);
    } else if (!isEqual(lastParams, params)) {
      lastParams = params;
      result = match.handler(lastRouter, params);
    }
    return result;
  });
}

export const beforeUnload = streamFromEvent(window, "beforeunload");

const preventNavigationIO = withEffects(
  (event: WindowEventMap["beforeunload"], shouldWarn: boolean) => {
    if (shouldWarn) {
      event.returnValue = "o/";
      return "o/";
    }
  }
);

/**
 * Takes a behavior of a boolean, if true the user will have to confirm before unloading page.
 * @param shouldWarnB A behavior of a boolean
 */
export function warnNavigation(
  shouldWarnB: Behavior<boolean>
): Now<Stream<string | undefined>> {
  const a = snapshotWith(preventNavigationIO, shouldWarnB, beforeUnload);
  return performStream(a).chain(flatFuturesOrdered);
}
