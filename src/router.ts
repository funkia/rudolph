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

function readParams(paramRecord: Record<string, number>, path: string): Record<string, string> {
  const pathVars = path.split("/");
  let params: Record<string, string> = {};
  for (const param of Object.keys(paramRecord)) {
    params[param] = pathVars[paramRecord[param]];
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
  const parts = pattern.split("/");
  let paramRecord: Record<string, number> = {};
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (fst(part) === ":") {
      paramRecord[part.substr(1)] = i;
    }
  }
  return locationBehavior.map((location) => readParams(paramRecord, location));
}
