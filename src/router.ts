import { withEffects } from "jabz";
import { performStreamOrdered, Stream, Behavior, sink, Now } from "hareactive";
import { takeUntilRight, fst } from "./utils";

export type ParamBehavior = Behavior<Record<string, string>>;

const navigateIO = withEffects((path: string) => window.location.hash = path);
/**
 * Takes a stream of URLs. Whenever the stream has an occurrence it is
 * navigated to.
 * @param urlStream A stream of URLs.
 */
export function navigate(urlStream: Stream<string>): Now<Stream<string>> {
  return performStreamOrdered(urlStream.map(navigateIO));
};

// locationHashB: Behavior<string> - string of location.hash
export const locationHashB = sink(takeUntilRight("#", window.location.hash));
window.addEventListener("hashchange", (evt) => locationHashB.push(takeUntilRight("#", evt.newURL)), false);

function readParams(pattern: string, path: string): Record<string, string> {
  const patternParts = pattern.split("/");
  let paramRecord: Record<string, number> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (fst(part) === ":") {
      paramRecord[part.substr(1)] = i;
    }
  }

  const pathParts = path.split("/");
  let params: Record<string, string> = {};
  for (const param of Object.keys(paramRecord)) {
    params[param] = pathParts[paramRecord[param]];
  }
  return params;
}

/**
 * Takes a URL pattern, a behavior of the current location and returns a
 * behavior with the result of parsing the location according to the pattern.
 * @param pattern An URL pattern of the form `foo/:param/bar`
 * @param locationBehavior A behavior describing the current location.
 */
export function parsePathParams(pattern: string, locationBehavior: Behavior<string>): Behavior<Record<string, string>> {
  return locationBehavior.map((location) => readParams(pattern, location));
}

type PathHandler<A> = (restUrl: string, params: Record<string, string>) => A;

type ParsedPathPattern<A> = {
  path: string[];
  params: Record<string, number>;
  length: number;
  handler: PathHandler<A>
};

function parsePathPattern<A>(pattern: string, handler: PathHandler<A>): ParsedPathPattern<A> {
  const patternParts = pattern.split("/");
  let p: ParsedPathPattern<A> = {
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

type Routes<A> = Record<string, (rest: string, params: Record<string, string>) => A>;

/**
 * Takes a description of the routes, a behavior of the current location and returns a
 * behavior with the result of parsing the location according to the pattern.
 * @param routes A description of the routes, in the form {"/route/:urlParam"; (restUrl, params) => result}
 * @param locationBehavior A behavior describing the current location.
 */
export function routePath<A>(routes: Routes<A>, locationBehavior: Behavior<string>): Behavior<A> {
  const parsedRoutes = Object.keys(routes).map((path) => parsePathPattern(path, routes[path]));

  return locationBehavior.map((location) => {
    const locationParts = location.split("/");
    const match = parsedRoutes.find(({ path }: ParsedPathPattern<A>) => path.every((part, index) => {
      console.log(part, locationParts[index]);
      return part === locationParts[index];
    }));
    const rest = "/" + locationParts.slice(match.length).join("/");

    let params: Record<string, string> = {};
    for (const key of Object.keys(match.params)) {
      params[key] = locationParts[match.params[key]];
    }
    return match.handler(rest, params);
  });
}
