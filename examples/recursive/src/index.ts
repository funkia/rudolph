import {runComponent} from "@funkia/turbine";
import {main} from "./app";
import { createRouter } from "../../../src/router";

const router = createRouter({
  useHash: true
});
runComponent("#mount", main({router}));
