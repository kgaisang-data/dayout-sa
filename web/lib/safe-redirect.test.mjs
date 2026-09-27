import assert from "node:assert/strict";
import test from "node:test";

import { safeInternalPath } from "./safe-redirect.ts";

test("safeInternalPath accepts normal same-site paths", () => {
  assert.equal(safeInternalPath("/saved", "/"), "/saved");
  assert.equal(safeInternalPath("/itinerary?plan=abc#top", "/"), "/itinerary?plan=abc#top");
});

test("safeInternalPath rejects absolute and protocol-relative redirects", () => {
  assert.equal(safeInternalPath("https://evil.example", "/plan"), "/plan");
  assert.equal(safeInternalPath("//evil.example/path", "/plan"), "/plan");
  assert.equal(safeInternalPath("javascript:alert(1)", "/plan"), "/plan");
});

test("safeInternalPath rejects backslash and encoded protocol-relative tricks", () => {
  assert.equal(safeInternalPath("/\\\\evil.example", "/plan"), "/plan");
  assert.equal(safeInternalPath("/%2f%2fevil.example", "/plan"), "/plan");
  assert.equal(safeInternalPath("/%5c%5cevil.example", "/plan"), "/plan");
});

test("safeInternalPath falls back for missing or malformed values", () => {
  assert.equal(safeInternalPath(null, "/saved"), "/saved");
  assert.equal(safeInternalPath("not-a-path", "/saved"), "/saved");
});
