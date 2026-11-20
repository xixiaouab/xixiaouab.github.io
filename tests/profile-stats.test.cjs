"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const code = fs.readFileSync(path.join(__dirname, "../docs/js/profile-stats.js"), "utf8");
const scholar = { profile: { scholar_id: "Q4DnRVgAAAAJ" }, summary: { total_citations: 927, updated: "2026-11-19" } };
const github = { schema_version: 2, scope: { visibility: "public", ownership: "personal_and_coauthored_research" }, profile: { login: "xixiaouab", scholar_id: "Q4DnRVgAAAAJ" }, summary: { total_stars: 65, updated: "2026-11-19" } };
const response = (data) => ({ ok: true, json: async () => data });

function fixture(fetcher, options = {}) {
  const calls = [];
  const events = {};
  const timers = new Map();
  let timerId = 0;
  function node() {
    const link = {};
    return { textContent: "HTML cache", closest: () => link, link };
  }
  const scholarNode = node(), githubNode = node();
  const window = {
    fetch: fetcher && ((url) => { calls.push(url); return fetcher(url); }),
    setTimeout: options.fakeTimers ? ((fn) => { timers.set(++timerId, fn); return timerId; }) : setTimeout,
    clearTimeout: options.fakeTimers ? ((id) => timers.delete(id)) : clearTimeout,
  };
  const document = {
    readyState: options.loading ? "loading" : "complete",
    baseURI: "https://xixiaouab.github.io/",
    addEventListener: (name, fn) => { events[name] = fn; },
    querySelectorAll: (selector) => options.noNodes ? [] :
      [selector.includes("scholar") ? scholarNode : githubNode],
  };
  const context = vm.createContext({ window, document, URL });
  vm.runInContext(code, context);
  return { window, calls, events, timers, scholarNode, githubNode, context };
}

(async () => {
  {
    const f = fixture(async (url) => response(url.includes("scholar") ? scholar : github));
    const promise = f.window.profileStatsReady;
    const [a, b] = await Promise.all([promise, promise]);
    assert.strictEqual(a, b, "Consumers must receive the same cached parsed object");
    assert.strictEqual(a.scholar, scholar);
    assert.strictEqual(a.github, github);
    assert.equal(f.calls.length, 2, "One request per metric for inline and footer consumers");
    assert.equal(f.scholarNode.textContent, "927");
    assert.equal(f.githubNode.textContent, "65");
    vm.runInContext(code, f.context);
    assert.strictEqual(f.window.profileStatsReady, promise, "A duplicate script load must reuse the promise");
    assert.equal(f.calls.length, 2);
  }
  {
    const stranger = { profile: { scholar_id: "OTHER_AUTHOR" }, summary: { total_citations: 999999 } };
    const f = fixture(async (url) => response(url.includes("scholar") ?
      (url.includes("raw.githubusercontent") ? stranger : scholar) : github));
    const result = await f.window.profileStatsReady;
    assert.strictEqual(result.scholar, scholar, "Wrong identity must fall back to the local owner cache");
    assert.equal(f.calls.length, 3);
    assert.equal(f.scholarNode.textContent, "927");
  }
  {
    const wrong = { profile: { login: "someone-else" }, summary: { total_stars: 999999 } };
    const f = fixture(async (url) => response(url.includes("scholar") ? scholar : wrong));
    const result = await f.window.profileStatsReady;
    assert.strictEqual(result.scholar, scholar);
    assert.equal(result.github, null, "Invalid raw and local identities resolve as null");
    assert.equal(f.githubNode.textContent, "HTML cache", "Failure must preserve visible HTML");
  }
  {
    const f = fixture(async () => { throw new Error("offline"); });
    const result = await f.window.profileStatsReady;
    assert.equal(result.scholar, null);
    assert.equal(result.github, null);
    assert.equal(f.calls.length, 4, "Each source is tried once, then its local cache once");
  }
  {
    const f = fixture(null);
    const result = await f.window.profileStatsReady;
    assert.equal(result.scholar, null);
    assert.equal(result.github, null);
  }
  {
    const f = fixture(async (url) => response(url.includes("scholar") ? scholar : github), { noNodes: true, loading: true });
    assert.ok(f.window.profileStatsReady && typeof f.window.profileStatsReady.then === "function");
    assert.equal(f.calls.length, 0, "Promise is exposed before DOM readiness");
    f.events.DOMContentLoaded();
    f.events.DOMContentLoaded();
    const result = await f.window.profileStatsReady;
    assert.strictEqual(result.scholar, scholar, "Footer still receives data without inline nodes");
    assert.equal(f.calls.length, 2);
  }
  {
    const f = fixture(() => new Promise(() => {}), { fakeTimers: true });
    await new Promise(setImmediate);
    [...f.timers.values()].forEach((fn) => fn());
    await new Promise(setImmediate);
    assert.equal(f.calls.length, 4, "A timed-out raw request must try the local cache");
    [...f.timers.values()].forEach((fn) => fn());
    const result = await f.window.profileStatsReady;
    assert.equal(result.scholar, null);
    assert.equal(result.github, null, "Hung requests must settle even without AbortController");
  }
  {
    const oldScope = { profile: { login: "xixiaouab" }, summary: { total_stars: 65 } };
    const f = fixture(async (url) => response(url.includes("scholar") ? scholar :
      (url.includes("raw.githubusercontent") ? oldScope : github)));
    const result = await f.window.profileStatsReady;
    assert.strictEqual(result.github, github, "An old owned-only cache cannot replace the expanded project total");
    assert.equal(f.calls.length, 3);
    assert.ok(f.githubNode.link.title.includes("excluding Agent Harness Engineering"));
  }
  console.log("PASS: shared promise, duplicate load, identity guards, cache fallback, failure, no fetch, DOM readiness, timeout");
})().catch((error) => { console.error(error); process.exitCode = 1; });
