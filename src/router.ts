import {withEffects} from "jabz";
import {performStreamOrdered, Stream, Behavior, sink, Now} from "hareactive";
import {takeUntilRight, updateRecord, fst} from "./utils";

// navigateS: Stream<string> - takes a stream of strings with new locations
const navigateIO = withEffects((path: string) => window.location.hash = path);
export function navigate(s: Stream<string>): Now<Stream<string>> {
  return performStreamOrdered(s.map(navigateIO));
};

// locationB: Behavior<string> - string of current location.
export const locationB = sink(takeUntilRight("#", window.location.hash));
window.addEventListener("hashchange", (evt) => locationB.push(takeUntilRight("#", evt.newURL)), false);

function readParams(paramRecord: Record<string, number>, path: string): Record<string, string> {
  const pathVars = path.split("/");
  return Object.keys(paramRecord)
  .reduce((rec, param) => updateRecord(rec, param, pathVars[paramRecord[param]]), <Record<string, string>>{});
}

export type ParamBehavior = Behavior<Record<string, string>>;

export function parsePathParams(pattern: string, locationBehavior: Behavior<string>): Behavior<Record<string, string>> {
  const paramRecord = pattern.split("/")
  .reduce((rec, param, index) => (fst(param) === ":") ? updateRecord(rec, param.substr(1), index) : rec, <Record<string, number>>{});
  return locationBehavior.map((location) => readParams(paramRecord, location));
}
