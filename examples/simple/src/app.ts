import { combine, fgo } from "@funkia/jabz";
import { Behavior, map, Now, Stream, snapshot } from "@funkia/hareactive";
import { elements, modelView, Component } from "@funkia/funnel";
const { h1, span, button, section, div, input } = elements;
import { navigate, routePath, Router } from "../../../src/router";

const prefix = (pre: string) => (str: string) => pre + str;

const user = fgo(function* (userId: number) {
  yield h1("User");
  yield span(`Here you see the data with the user: ${userId}`);
});

const home = fgo(function* () {
  yield h1("Home");
  yield span("Here is your home screen.");
});

const notFound = fgo(function* () {
  yield h1("404: Page not found");
  yield span("Nothing to find here...");
});

type FromView = {
  userClicks: Stream<any>,
  homeClicks: Stream<any>,
  inputValue: Behavior<string>
};

type ToView = {};
type Out = {};

function menu(router: Router): Component<any> {
  return modelView<ToView, FromView, Out>(menuModel(router), menuView(router));
}

const menuModel = (router: Router) => function* ({ userClicks, homeClicks, inputValue }: FromView) {
  const userIds = snapshot(inputValue, userClicks);
  const navs = combine(userIds.map(prefix("/user/")), homeClicks.mapTo("/"));
  yield navigate(router, navs);
  return [{}, {}];
};

function menuView(router: Router) {
  return () => [
    div([
      button({ output: { "homeClicks": "click" } }, "Home"),
      button({ output: { "userClicks": "click" } }, "Find User:"),
      input()
    ]),
    section(routePath({
      "/user/:userId": (subrouter, { userId }) => user(userId),
      "/": home,
      "*": notFound
    }, router))
  ];
}

export const main = menu;
