// The destination catalogue and the country picker, asked over HTTP.
//
// Runs the real app against its own database (…/tourgenie_catalogtest),
// created and dropped per run, so it never touches real data.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-secret-for-the-catalog-suite";

let server;
let base;

async function call(method, path, body) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

before(async () => {
  const uri = process.env.MONGODB_URI;
  assert.ok(uri, "MONGODB_URI must be set to run these tests");
  await mongoose.connect(uri.replace(/\/([^/?]+)(\?|$)/, "/tourgenie_catalogtest$2"));
  assert.equal(mongoose.connection.name, "tourgenie_catalogtest");

  const { default: Country } = await import("../src/models/Country.js");
  const { default: Destination } = await import("../src/models/Destination.js");
  const { default: InterestTag } = await import("../src/models/InterestTag.js");
  await Country.create([
    { code: "BD", name: "Bangladesh", currency: "BDT", is_core: true },
    { code: "TH", name: "Thailand", currency: "THB", is_core: true },
    { code: "NP", name: "Nepal", currency: "NPR", is_active: false },
  ]);
  await Destination.create([
    { slug: "coxs-bazar", name: "Cox's Bazar", aliases: ["Coxs Bazar"], type: "beach", tags: ["beach"], lat_lng: { lat: 21.4272, lng: 92.0058 } },
    { slug: "sylhet", name: "Sylhet", type: "hill", tags: ["tea"], lat_lng: { lat: 24.8949, lng: 91.8687 } },
    { slug: "phuket", name: "Phuket", country: "Thailand", country_code: "TH", type: "island", lat_lng: { lat: 7.8804, lng: 98.3923 } },
    { slug: "closed-place", name: "Closed Place", type: "city", is_active: false },
  ]);
  await InterestTag.create([
    { code: "hills", label: "Hills", sort_order: 2 },
    { code: "beach", label: "Beach", sort_order: 1 },
  ]);

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

test("the catalogue lists active destinations with per-country counts", async () => {
  const { status, body } = await call("GET", "/destinations");
  assert.equal(status, 200);
  assert.deepEqual(body.destinations.map((d) => d.slug).sort(), ["coxs-bazar", "phuket", "sylhet"]);
  const bd = body.countries.find((c) => c.code === "BD");
  assert.equal(bd.destinations, 2);
  assert.ok(!body.countries.some((c) => c.code === "NP"), "inactive countries are hidden");
});

test("the catalogue filters by country, type and search text", async () => {
  const th = await call("GET", "/destinations?country_code=th");
  assert.deepEqual(th.body.destinations.map((d) => d.slug), ["phuket"]);

  const hills = await call("GET", "/destinations?type=hill");
  assert.deepEqual(hills.body.destinations.map((d) => d.slug), ["sylhet"]);

  const alias = await call("GET", "/destinations?q=coxs");
  assert.deepEqual(alias.body.destinations.map((d) => d.slug), ["coxs-bazar"]);

  // Regex characters are matched literally, not interpreted.
  const odd = await call("GET", "/destinations?q=.*");
  assert.equal(odd.body.destinations.length, 0);
});

test("one destination is found by slug, and an inactive one is not", async () => {
  const found = await call("GET", "/destinations/COXS-BAZAR");
  assert.equal(found.status, 200);
  assert.equal(found.body.destination.name, "Cox's Bazar");
  assert.deepEqual(found.body.destination.location.coordinates, [92.0058, 21.4272]);

  assert.equal((await call("GET", "/destinations/closed-place")).status, 404);
  assert.equal((await call("GET", "/destinations/nowhere")).status, 404);
});

test("reference data lists countries and interest tags in order", async () => {
  const countries = await call("GET", "/reference/countries");
  assert.equal(countries.status, 200);
  assert.deepEqual(countries.body.countries.map((c) => c.code), ["BD", "TH"]);

  const tags = await call("GET", "/reference/interest-tags");
  assert.deepEqual(tags.body.tags.map((t) => t.code), ["beach", "hills"]);
});

test("sign-up stores the chosen country, and refuses one not in the list", async () => {
  const picked = await call("POST", "/auth/register", {
    name: "Somchai", email: "somchai@example.com", password: "secret1", country_code: "th",
  });
  assert.equal(picked.status, 201);
  assert.equal(picked.body.user.country_code, "TH");
  assert.equal(picked.body.user.country, "Thailand");

  const defaulted = await call("POST", "/auth/register", {
    name: "Rina", email: "rina@example.com", password: "secret1",
  });
  assert.equal(defaulted.status, 201);
  assert.equal(defaulted.body.user.country_code, "BD");

  for (const country_code of ["NP", "ZZ"]) {
    const refused = await call("POST", "/auth/register", {
      name: "X", email: `x-${country_code}@example.com`, password: "secret1", country_code,
    });
    assert.equal(refused.status, 400, `${country_code} should be refused`);
  }
});
