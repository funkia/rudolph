import { map, go, combine } from "jabz";
import { sample, scanS, Stream, Now, empty, Behavior } from "hareactive";
import { elements, loop, component, Component } from "@funkia/funnel";
const { h1, span, input, button, div } = elements;
import { locationB, navigate, parsePathParams, ParamBehavior } from "../../../src/router";

type FromView = {
  listBtn: Stream<any>
  viewBtn: Stream<any>
}

type ToView = {
  content: Behavior<Component<any>>
}

type Out = {
  router: any
}

const menu = component<ToView, FromView, Out>(
  function* model({ listBtn, viewBtn }) {
    const navs = combine(listBtn.mapTo("/list"), viewBtn.mapTo("/view"));
    yield navigate(navs);
    const params = parsePathParams("/:item", locationB)
    const content = params.map(({item}) => {
      switch (item) {
        case "list":
        return h1("ListContent");
        case "view":
        return span("ViewContent").chain(() => input());
        default:
        return h1("404");
      }
    })
    return [{ content }, {}];
  }, ({ content }) => [
    content,
    button({ output: { click: "viewBtn" } }, "view"),
    button({ output: { click: "listBtn" } }, "list")
  ]);

export const main = component<{ l: Behavior<string> }, { }, Out>(
  function model({ }) {
    const a = parsePathParams("/users", locationB);
    locationB.subscribe(console.log);
    return Now.of([{ l: locationB }, {}]);
  }, ({ l }) => h1(["locationB: ", l]).chain(() => menu));
