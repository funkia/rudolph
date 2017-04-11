import {runComponent} from "@funkia/funnel";
import {main} from "./app";
import { createRouter } from "../../../src/router";

const router = createRouter({
  useHash: true
});
runComponent("#mount", main(router));
