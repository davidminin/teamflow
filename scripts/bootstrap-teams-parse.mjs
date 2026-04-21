/**
 * Parses bootstrap CLI argv and env. See bootstrap-teams.mjs for usage notes.
 */
export function parseBootstrapArgs(argv, env = process.env) {
  let explicitDepartments = null;
  const positional = [];
  let createDefaults = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--create-default-teams") {
      createDefaults = true;
      continue;
    }
    if (a === "--departments") {
      const v = argv[i + 1];
      if (v === undefined) {
        explicitDepartments = [];
      } else {
        i += 1;
        explicitDepartments = v
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
      }
      continue;
    }
    if (a.startsWith("--departments=")) {
      const v = a.slice("--departments=".length);
      explicitDepartments = v
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      continue;
    }
    if (a.startsWith("-")) {
      continue;
    }
    positional.push(a);
  }

  const envCreate = env.TEAMFLOW_CREATE_DEFAULT_TEAMS;
  if (envCreate === "1" || envCreate === "true") {
    createDefaults = true;
  }

  let departments;
  if (explicitDepartments !== null) {
    departments = explicitDepartments;
  } else if (positional.length > 0) {
    departments = [];
    for (const p of positional) {
      if (p.includes(",")) {
        departments.push(
          ...p
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean),
        );
      } else {
        departments.push(p.trim().toLowerCase());
      }
    }
  } else if (env.TEAMFLOW_DEPARTMENTS) {
    departments = env.TEAMFLOW_DEPARTMENTS.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  } else {
    departments = [];
  }

  return { departments, createDefaults };
}
