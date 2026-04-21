import fs from "node:fs";
import path from "node:path";

import { parseBootstrapArgs } from "./bootstrap-teams-parse.mjs";

const args = process.argv.slice(2);
const { departments, createDefaults } = parseBootstrapArgs(args);

function printUsage() {
  console.error(`Usage:
  node scripts/bootstrap-teams.mjs --departments qa,eng,ops --create-default-teams

  Environment variables (works with npm run on Windows PowerShell):
    TEAMFLOW_DEPARTMENTS=qa,eng,ops
    TEAMFLOW_CREATE_DEFAULT_TEAMS=1

  Quickstart (default departments + default teams, no extra args):
    npm run bootstrap:quickstart`);
}

if (departments.length === 0) {
  printUsage();
  process.exit(1);
}

const defaultsByDepartment = {
  qa: ["qa-automation"],
  eng: ["platform"],
  ops: ["incident-response"],
};

const root = process.cwd();
const teamsDir = path.join(root, "teams");
fs.mkdirSync(teamsDir, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  departments: [],
};

for (const department of departments) {
  const departmentDir = path.join(teamsDir, department);
  fs.mkdirSync(departmentDir, { recursive: true });

  const teams = createDefaults
    ? defaultsByDepartment[department] || [`${department}-core`]
    : [];

  const teamRecords = [];
  for (const team of teams) {
    const teamDir = path.join(departmentDir, team);
    fs.mkdirSync(path.join(teamDir, "workflows"), { recursive: true });
    fs.mkdirSync(path.join(teamDir, "code"), { recursive: true });
    fs.mkdirSync(path.join(teamDir, "docs"), { recursive: true });

    const runbookPath = path.join(teamDir, "docs", "runbook.md");
    if (!fs.existsSync(runbookPath)) {
      fs.writeFileSync(
        runbookPath,
        `# ${department}/${team} runbook\n\n- Owner:\n- On-call:\n- Workflow conventions: dept:${department}, team:${team}\n`,
      );
    }

    teamRecords.push({
      slug: team,
      n8nNamespace: `${department}/${team}`,
      workflowsPath: `teams/${department}/${team}/workflows`,
    });
  }

  manifest.departments.push({
    slug: department,
    teams: teamRecords,
  });
}

fs.writeFileSync(
  path.join(teamsDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const portalManifestPath = path.join(
  root,
  "apps",
  "portal",
  "src",
  "data",
  "manifest.json",
);
if (fs.existsSync(path.dirname(portalManifestPath))) {
  fs.writeFileSync(portalManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log("Bootstrap completed.");
console.log(`Departments: ${departments.join(", ")}`);
