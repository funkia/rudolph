import {runMain} from "@funkia/funnel";
import {main} from "./app";
import { createRouter } from "../../../src/router";

const router = createRouter({
  useHash: true
});
runMain("#mount", main(router));
