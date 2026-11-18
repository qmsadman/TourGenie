// The app answers over HTTP without a database: the health check and the
// 404 handler are the two things every route sits between.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let base;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test("GET /api/health reports the service is up", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
});

test("an unknown route is a JSON 404, not an HTML page", async () => {
  const res = await fetch(`${base}/api/nothing-here`);
  assert.equal(res.status, 404);
  assert.match((await res.json()).message, /Route not found: GET \/api\/nothing-here/);
});
