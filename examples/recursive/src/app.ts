import { combine, go, fgo, map } from "@funkia/jabz";
import { Behavior, Now, Stream, snapshot } from "@funkia/hareactive";
import { elements, modelView, Component } from "@funkia/turbine";
const { h1, span, button, section, div, input } = elements;
import { navigate, routePath, Router } from "../../../src/router";

const prefix = (pre: string) => (str: string) => pre + str;

const file = fgo(function*(filename: string): IterableIterator<Component<{}>> {
  yield h1("File: " + filename);
  yield span(
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia libero id massa semper, sed maximus diam venenatis.`
  );
});

const notFound = fgo(function*(): IterableIterator<Component<{}>> {
  yield h1("404: Page not found");
  yield span("Nothing to find here...");
});

const style: Partial<CSSStyleDeclaration> = {
  border: "1px solid black",
  padding: "15px"
};

type DirectoryIn = {
  router: Router;
  directoryName: string;
};

function directoryView(
  {},
  { router, directoryName }: DirectoryIn
): Component<any> {
  return div([
    span(`Directory: ${directoryName} is containing:`),
    div([
      button({ output: { A: "click" } }, "dir A"),
      button({ output: { B: "click" } }, "dir B"),
      button({ output: { C: "click" } }, "dir C"),
      button({ output: { D: "click" } }, "file D")
    ]),
    div(
      { style },
      routePath(
        {
          "/d/:dirname": (subrouter, { dirname }) =>
            directory({ router: subrouter, directoryName: dirname }),
          "/f/:filename": (_, { filename }) => file(filename),
          "*": () => Component.of(undefined)
        },
        router
      )
    )
  ]).map(({ A, B, C, D }) => ({
    navs: combine(
      A.mapTo("/d/A"),
      B.mapTo("/d/B"),
      C.mapTo("/d/C"),
      D.mapTo("/f/D")
    )
  }));
}

type FromView = {
  navs: Stream<string>;
};

function* directoryModel({ navs }: FromView, { router }: DirectoryIn) {
  yield navigate(router, navs);
  return {};
}

const directory = modelView(directoryModel, directoryView);

type In = {
  router: Router;
};

export const main = ({ router }: In) =>
  directory({ router, directoryName: "root" });
