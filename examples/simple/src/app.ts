import { combine } from "jabz";
import { Stream, Now, Behavior } from "hareactive";
import { elements, component, Component } from "@funkia/funnel";
const { h1, span, input, button, div } = elements;
import { locationHashB, navigate, parsePathParams } from "../../../src/router";

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
    const params = parsePathParams("/:item", locationHashB);
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
    const a = parsePathParams("/users", locationHashB);
    
    return Now.of([{ l: locationHashB }, {}]);
  }, ({ l }) => h1(["locationB: ", l]).chain(() => menu));
