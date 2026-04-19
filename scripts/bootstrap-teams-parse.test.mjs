import assert from "node:assert/strict";
import test from "node:test";

import { parseBootstrapArgs } from "./bootstrap-teams-parse.mjs";

test("parses --departments and --create-default-teams", () => {
  const r = parseBootstrapArgs(
    ["--departments", "qa,eng,ops", "--create-default-teams"],
    {},
  );
  assert.deepEqual(r.departments, ["qa", "eng", "ops"]);
  assert.equal(r.createDefaults, true);
});

test("parses --departments=value form", () => {
  const r = parseBootstrapArgs(["--departments=qa,eng"], {});
  assert.deepEqual(r.departments, ["qa", "eng"]);
  assert.equal(r.createDefaults, false);
});

test("positional slugs (e.g. forwarded by npm on Windows)", () => {
  const r = parseBootstrapArgs(["qa", "eng", "ops"], {});
  assert.deepEqual(r.departments, ["qa", "eng", "ops"]);
});

test("positional comma-separated token", () => {
  const r = parseBootstrapArgs(["qa,eng,ops"], {});
  assert.deepEqual(r.departments, ["qa", "eng", "ops"]);
});

test("TEAMFLOW_* env when argv has no departments", () => {
  const r = parseBootstrapArgs([], {
    TEAMFLOW_DEPARTMENTS: "qa, ops",
    TEAMFLOW_CREATE_DEFAULT_TEAMS: "true",
  });
  assert.deepEqual(r.departments, ["qa", "ops"]);
  assert.equal(r.createDefaults, true);
});

test("explicit --departments wins over env", () => {
  const r = parseBootstrapArgs(["--departments", "eng"], {
    TEAMFLOW_DEPARTMENTS: "qa",
  });
  assert.deepEqual(r.departments, ["eng"]);
});
