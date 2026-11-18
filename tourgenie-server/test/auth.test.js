// Sign-up, sign-in and password recovery, asked over HTTP.
//
// Runs the real app on a port against its own database (…/tourgenie_authtest),
// created and dropped per run, so it can never touch real accounts. Mail is
// switched off, which makes the API hand the reset code back in development —
// the same path a developer without a mailbox uses.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import "dotenv/config";

process.env.MAIL_USER = "";
process.env.MAIL_PASS = "";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-secret-for-the-auth-suite";

let server;
let base;

async function call(method, path, body, token) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

before(async () => {
  const uri = process.env.MONGODB_URI;
  assert.ok(uri, "MONGODB_URI must be set to run these tests");
  await mongoose.connect(uri.replace(/\/([^/?]+)(\?|$)/, "/tourgenie_authtest$2"));
  assert.equal(mongoose.connection.name, "tourgenie_authtest");

  const { default: app } = await import("../src/app.js");
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server?.close();
});

test("sign-up refuses a malformed email and a short password", async () => {
  const badEmail = await call("POST", "/auth/register", { name: "A", email: "abc", password: "secret1" });
  assert.equal(badEmail.status, 400);

  const shortPassword = await call("POST", "/auth/register", { name: "A", email: "a@example.com", password: "123" });
  assert.equal(shortPassword.status, 400);
});

test("sign-up creates an account once, and /me answers with its token", async () => {
  const created = await call("POST", "/auth/register", {
    name: "Rina",
    email: "Rina@Example.com",
    password: "first-pass",
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.user.email, "rina@example.com");

  const again = await call("POST", "/auth/register", { name: "Rina", email: "rina@example.com", password: "first-pass" });
  assert.equal(again.status, 409);

  const me = await call("GET", "/auth/me", null, created.body.token);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.name, "Rina");
});

test("a password reset by emailed code ends the sessions signed before it", async () => {
  const before = await call("POST", "/auth/login", { email: "rina@example.com", password: "first-pass" });
  assert.equal(before.status, 200);
  const oldToken = before.body.token;

  const sent = await call("POST", "/auth/forgot-password", { email: "rina@example.com" });
  assert.equal(sent.status, 200);
  assert.match(sent.body.dev_otp, /^\d{6}$/);

  const wrongCode = sent.body.dev_otp === "000000" ? "111111" : "000000";
  const wrong = await call("POST", "/auth/verify-otp", { email: "rina@example.com", otp: wrongCode });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.body.attempts_left, 4);

  const verified = await call("POST", "/auth/verify-otp", { email: "rina@example.com", otp: sent.body.dev_otp });
  assert.equal(verified.status, 200);

  // The reset token only unlocks step 3; it is not a session.
  const misuse = await call("GET", "/auth/me", null, verified.body.reset_token);
  assert.equal(misuse.status, 401);

  const reset = await call("POST", "/auth/reset-password", {
    reset_token: verified.body.reset_token,
    password: "second-pass",
  });
  assert.equal(reset.status, 200);

  const replay = await call("POST", "/auth/reset-password", {
    reset_token: verified.body.reset_token,
    password: "third-pass",
  });
  assert.equal(replay.status, 401);

  assert.equal((await call("GET", "/auth/me", null, oldToken)).status, 401);
  assert.equal((await call("POST", "/auth/login", { email: "rina@example.com", password: "first-pass" })).status, 401);
  assert.equal((await call("POST", "/auth/login", { email: "rina@example.com", password: "second-pass" })).status, 200);
});

test("asking for a second code straight away is refused with a wait time", async () => {
  const again = await call("POST", "/auth/forgot-password", { email: "rina@example.com" });
  assert.equal(again.status, 429);
  assert.ok(again.body.retry_after > 0);
});

test("an unknown address gets the same answer as a real one", async () => {
  const res = await call("POST", "/auth/forgot-password", { email: "nobody@example.com" });
  assert.equal(res.status, 200);
  assert.equal(res.body.dev_otp, undefined);
});

test("changing a password keeps this session and ends the others", async () => {
  const phone = (await call("POST", "/auth/login", { email: "rina@example.com", password: "second-pass" })).body.token;
  const laptop = (await call("POST", "/auth/login", { email: "rina@example.com", password: "second-pass" })).body.token;

  const wrong = await call(
    "POST",
    "/auth/change-password",
    { current_password: "not-it", new_password: "fourth-pass" },
    laptop
  );
  assert.equal(wrong.status, 401);

  const changed = await call(
    "POST",
    "/auth/change-password",
    { current_password: "second-pass", new_password: "fourth-pass" },
    laptop
  );
  assert.equal(changed.status, 200);

  assert.equal((await call("GET", "/auth/me", null, changed.body.token)).status, 200);
  assert.equal((await call("GET", "/auth/me", null, phone)).status, 401);
});

test("ten wrong passwords lock sign-in from this address, even for the right one", async () => {
  // Earlier tests already spent some of this address's failures, so guess
  // until the lock arrives rather than assuming a fresh count — but never
  // more than the limit allows.
  let status = 401;
  let guesses = 0;
  while (status === 401) {
    guesses += 1;
    assert.ok(guesses <= 11, "the lock never arrived");
    status = (await call("POST", "/auth/login", { email: "rina@example.com", password: `guess-${guesses}` })).status;
  }
  assert.equal(status, 429);

  const locked = await call("POST", "/auth/login", { email: "rina@example.com", password: "fourth-pass" });
  assert.equal(locked.status, 429);
  assert.ok(locked.body.retry_after > 0);
});
