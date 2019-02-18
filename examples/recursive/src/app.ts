import { combine, fgo } from "@funkia/jabz";
import { Stream } from "@funkia/hareactive";
import { elements, modelView, Component, toComponent } from "@funkia/turbine";
const { h1, span, button, div } = elements;
import { navigate, routePath, Router } from "../../../src/router";

const file = (filename: string) =>
  toComponent([
    h1("File: " + filename),
    span(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia libero id massa semper, sed maximus diam venenatis."
    )
  ]);

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
): Component<{ navs: any }, any> {
  return div([
    span(`Directory: ${directoryName} is containing:`),
    div([
      button("dir A").output({ A: "click" }),
      button("dir B").output({ B: "click" }),
      button("dir C").output({ C: "click" }),
      button("file D").output({ D: "click" })
    ]),
    div(
      { style },
      routePath(
        {
          "/d/:dirname": (subrouter, { dirname }) =>
            directory({ router: subrouter, directoryName: dirname }),
          "/f/:filename": (_, { filename }) => file(filename),
          "*": () => Component.of({})
        },
        router
      )
    )
  ])
    .map(({ A, B, C, D }) => ({
      navs: combine(
        A.mapTo("/d/A"),
        B.mapTo("/d/B"),
        C.mapTo("/d/C"),
        D.mapTo("/f/D")
      )
    }))
    .output({ navs: "navs" });
}

type FromView = {
  navs: Stream<string>;
};

const directoryModel = fgo(function*(
  { navs }: FromView,
  { router }: DirectoryIn
) {
  yield navigate(router, navs);
  return {};
});

const directory = modelView(directoryModel, directoryView);

type In = {
  router: Router;
};

export const main = ({ router }: In) =>
  directory({ router, directoryName: "root" });
