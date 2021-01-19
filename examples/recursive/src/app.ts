import { combine } from "@funkia/jabz";
import { Stream } from "@funkia/hareactive";
import {
  elements as E,
  dynamic,
  Component,
  toComponent,
  component,
} from "@funkia/turbine";
import { navigate, routePath, Router } from "../../../src/router";

const file = (filename: string) =>
  toComponent([
    E.h1("File: " + filename),
    E.span(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia libero id massa semper, sed maximus diam venenatis."
    ),
  ]);

const style: Partial<CSSStyleDeclaration> = {
  border: "1px solid black",
  padding: "15px",
};

type On = {
  A: Stream<MouseEvent>;
  B: Stream<MouseEvent>;
  C: Stream<MouseEvent>;
  D: Stream<MouseEvent>;
};

type Props = {
  directoryName: string;
  router: Router;
};

const directory = (props: Props): Component<any, any> =>
  component<On>((on, start) => {
    const navs = combine(
      on.A.mapTo("/d/A"),
      on.B.mapTo("/d/B"),
      on.C.mapTo("/d/C"),
      on.D.mapTo("/f/D")
    );
    start(navigate(props.router, navs));

    return E.div([
      E.span(`Directory: ${props.directoryName} is containing:`),
      E.div([
        E.button("dir A").use({ A: "click" }),
        E.button("dir B").use({ B: "click" }),
        E.button("dir C").use({ C: "click" }),
        E.button("file D").use({ D: "click" }),
      ]),
      E.div(
        { style },
        dynamic(
          routePath(
            {
              "/d/:dirname": (subrouter, { dirname }) =>
                directory({ router: subrouter, directoryName: dirname }),
              "/f/:filename": (_, { filename }) => file(filename),
              "*": () => Component.of({}),
            },
            props.router
          )
        )
      ),
    ]);
  });

export const main = ({ router }: Props) =>
  directory({ router, directoryName: "root" });
