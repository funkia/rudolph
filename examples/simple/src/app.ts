import { Behavior, Stream, snapshot } from "@funkia/hareactive";
import { elements as E, toComponent, component } from "@funkia/turbine";
import { navigate, routePath, Router } from "../../../src/router";

const prefix = (pre: string) => (str: string) => pre + str;

const user = (userId: string) =>
  toComponent([
    E.h1("User"),
    E.span(`Here you see the profile of user: ${userId}`),
  ]);

const home = toComponent([E.h1("Home"), E.span("Here is your home screen.")]);

const notFound = toComponent([
  E.h1("404: Page not found"),
  E.span("Nothing to find here..."),
]);

type On = {
  userClicks: Stream<MouseEvent>;
  homeClicks: Stream<MouseEvent>;
  userId: Behavior<string>;
};

type Props = {
  router: Router;
};

const menu = (props: Props) =>
  component<On>((on, start) => {
    const userIds = snapshot(on.userId, on.userClicks).log("userIds");
    const navs: Stream<string> = userIds
      .map(prefix("/user/"))
      .combine(on.homeClicks.mapTo("/"));
    start(navigate(props.router, navs));

    return E.div([
      E.div([
        E.button("Home").use({ homeClicks: "click" }),
        E.button("Find User:").use({ userClicks: "click" }),
        E.input().use({ userId: "value" }),
      ]),
      E.section(
        routePath(
          {
            "/user/:userId": (_subrouter, { userId }) => user(userId),
            "/": () => home,
            "*": () => notFound,
          },
          props.router
        )
      ),
    ]);
  });

export const main = menu;
