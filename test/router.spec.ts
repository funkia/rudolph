import {assert} from "chai";
import { spy } from "sinon";
import * as H from "@funkia/hareactive";
import * as R from "../src/router";

describe("routePath", () => {
  it("should change the behavior according to the path", () => {
    const path = H.sinkBehavior("/admin");
    const router = R.createRouter({path});
    const content = R.routePath({
      "/": () => 1,
      "/user": () => 2,
      "/admin": () => 3
    }, router);

    assert.strictEqual(content.at(), 3);
    path.push("/user");
    assert.strictEqual(content.at(), 2);
    path.push("/");
    assert.strictEqual(content.at(), 1);
  });

  it("should use the \"*\" route as fallback", () => {
    const path = H.sinkBehavior("/cats");
    const router = R.createRouter({path});
    const content = R.routePath({
      "/": () => 1,
      "/user": () => 2,
      "/admin": () => 3,
      "*": () => 404
    }, router);
    assert.strictEqual(content.at(), 404);
    path.push("/user");
    assert.strictEqual(content.at(), 2);
    path.push("/dogs");
    assert.strictEqual(content.at(), 404);
  });

  it("should support subrouting", () => {
    const path = H.sinkBehavior("/");
    const router = R.createRouter({path});

    const subRoute = (subrouter: R.Router) => R.routePath({
      "/admin": () => 2,
      "/user": () => 3,
      "*": () => 0
     }, subrouter);

    const content = R.routePath({
      "/": () => H.Behavior.of(1),
      "/company": subRoute,
      "*": () => H.Behavior.of(404)
    }, router);

    assert.strictEqual(content.flatten().at(), 1);
    path.push("/company");
    assert.strictEqual(content.flatten().at(), 0);
    path.push("/company/admin");
    assert.strictEqual(content.flatten().at(), 2);
  });

  it("should only call the subRouteHandler if only subroute changed", () => {
    const path = H.sinkBehavior("/company/admin");
    const router = R.createRouter({path});
    const topRender = spy();
    const subRender = spy();

    const subRoute = (subrouter: R.Router) => R.routePath({
      "/admin": () => { subRender(); return 1; },
      "/user": () => { subRender(); return 2; }
     }, subrouter);

    const content = R.routePath({
      "/company": (r) => {
        topRender();
        return subRoute(r);
      }
    }, router);

    content.flatten().at();
    assert.strictEqual(topRender.callCount, 1);
    assert.strictEqual(subRender.callCount, 1);
    path.push("/company/user");
    content.flatten().at();
    assert.strictEqual(topRender.callCount, 1);
    assert.strictEqual(subRender.callCount, 2);
  });
});
