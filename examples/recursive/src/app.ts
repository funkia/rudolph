import { combine, go, fgo } from "@funkia/jabz";
import { Behavior, map, Now, Stream, snapshot } from "@funkia/hareactive";
import { elements, modelView, Component } from "@funkia/funnel";
const { h1, span, button, section, div, input } = elements;
import { navigate, routePath, Router } from "../../../src/router";

const prefix = (pre: string) => (str: string) => pre + str;

const file = fgo(function* (filename: string) {
  yield h1("File: " + filename);
  yield span(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia libero id massa semper, sed maximus diam venenatis.`);
});

const notFound = fgo(function* () {
  yield h1("404: Page not found");
  yield span("Nothing to find here...");
});

const style: Partial<CSSStyleDeclaration> = {
  border: "1px solid black",
  padding: "15px"
};

function directoryView(router: Router, directoryName: string) {
  return function() {
    return div([
    span(`Directory: ${directoryName} is containing:`),
    div([
      button({ output: {A: "click"}}, "dir A"),
      button({ output: {B: "click"}}, "dir B"),
      button({ output: {C: "click"}}, "dir C"),
      button({ output: {D: "click"}}, "file D")
    ]),
    div({ style },
      routePath({
        "/d/:dirname": (subrouter, { dirname }) => directory(subrouter, dirname),
        "/f/:filename": (_, { filename }) => file(filename),
        "*": () => Component.of()
      }, router))
  ]);
  }
}

type FromView = {
  A: Stream<any>,
  B: Stream<any>,
  C: Stream<any>,
  D: Stream<any>
}

function directoryModel(router: Router) {
  return function*({A, B, C, D}: FromView) {
    const navs = combine(A.mapTo("/d/A"), B.mapTo("/d/B"), C.mapTo("/d/C"), D.mapTo("/f/D"));
    yield navigate(router, navs);
    return [{}, {}];
  };
}

const directory = (router: Router, dirname: string) =>  modelView(directoryModel(router), directoryView(router, dirname));

export const main = (router: Router) => directory(router, "root");
