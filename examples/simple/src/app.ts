import { combine, fgo } from "@funkia/jabz";
import { Behavior, Stream, snapshot } from "@funkia/hareactive";
import { elements, modelView, toComponent, Component } from "@funkia/turbine";
const { h1, span, button, section, div, input } = elements;
import { navigate, routePath, Router } from "../../../src/router";

const prefix = (pre: string) => (str: string) => pre + str;

const user = (userId: string) =>
  toComponent([
    h1("User"),
    span(`Here you see the profile of user: ${userId}`)
  ]);

const home = toComponent([h1("Home"), span("Here is your home screen.")]);

const notFound = toComponent([
  h1("404: Page not found"),
  span("Nothing to find here...")
]);

type FromView = {
  userClicks: Stream<any>;
  homeClicks: Stream<any>;
  userId: Behavior<string>;
};

type ToView = {};
type Out = {};
type In = {
  router: Router;
};

const menuModel = fgo(function*(
  { userClicks, homeClicks, userId }: FromView,
  { router }: In
) {
  const userIds = snapshot(userId, userClicks);
  const navs = combine(userIds.map(prefix("/user/")), homeClicks.mapTo("/"));
  yield navigate(router, navs);
  return {};
});

function menuView({}, { router }: In) {
  return [
    div([
      button({ output: { homeClicks: "click" } }, "Home"),
      button({ output: { userClicks: "click" } }, "Find User:"),
      input({ output: { userId: "inputValue" } })
    ]),
    section(
      routePath(
        {
          "/user/:userId": (_subrouter, { userId }) => user(userId),
          "/": () => home,
          "*": () => notFound
        },
        router
      )
    )
  ];
}

const menu = modelView(menuModel, menuView);

export const main = menu;
