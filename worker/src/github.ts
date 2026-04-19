/**
 * GitHub Client for Worker
 *
 * Reads repo files, commits changes, creates branches.
 * Uses GitHub REST API directly (no SDK dependency).
 */

const GITHUB_API = "https://api.github.com";

interface GHConfig {
  token: string;
  owner: string;
  repo: string;
}

function getGHConfig(): GHConfig {
  const token = process.env.GITHUB_TOKEN;
  const repoFull = process.env.GITHUB_REPO || ""; // "owner/repo"
  if (!token) throw new Error("GITHUB_TOKEN not set");
  if (!repoFull) throw new Error("GITHUB_REPO not set (format: owner/repo)");

  const [owner, repo] = repoFull.split("/");
  return { token, owner, repo };
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/**
 * Get a file's content from the repo.
 */
export async function getFileContent(
  path: string,
  ref = "main"
): Promise<{ content: string; sha: string } | null> {
  const cfg = getGHConfig();
  const url = `${GITHUB_API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${ref}`;

  const res = await fetch(url, { headers: headers(cfg.token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

/**
 * List files in a directory.
 */
export async function listDirectory(
  path: string,
  ref = "main"
): Promise<{ name: string; type: string; path: string }[]> {
  const cfg = getGHConfig();
  const url = `${GITHUB_API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${ref}`;

  const res = await fetch(url, { headers: headers(cfg.token) });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub LIST ${path}: ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((item: { name: string; type: string; path: string }) => ({
    name: item.name,
    type: item.type,
    path: item.path,
  }));
}

/**
 * Get the repo tree (for providing structure context to LLM).
 */
export async function getRepoTree(ref = "main", maxDepth = 3): Promise<string> {
  const cfg = getGHConfig();
  const url = `${GITHUB_API}/repos/${cfg.owner}/${cfg.repo}/git/trees/${ref}?recursive=1`;

  const res = await fetch(url, { headers: headers(cfg.token) });
  if (!res.ok) throw new Error(`GitHub tree: ${res.status}`);

  const data = await res.json();
  const paths = (data.tree || [])
    .filter((item: { type: string; path: string }) => {
      // Filter to reasonable depth and skip node_modules, .next, etc.
      const depth = item.path.split("/").length;
      if (depth > maxDepth) return false;
      if (item.path.includes("node_modules")) return false;
      if (item.path.includes(".next")) return false;
      if (item.path.includes(".git")) return false;
      return true;
    })
    .map((item: { path: string; type: string }) =>
      `${item.type === "tree" ? "📁" : "📄"} ${item.path}`
    );

  return paths.join("\n");
}

/**
 * Get the SHA of a branch.
 */
export async function getBranchSHA(branch: string): Promise<string> {
  const cfg = getGHConfig();
  const url = `${GITHUB_API}/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${branch}`;

  const res = await fetch(url, { headers: headers(cfg.token) });
  if (!res.ok) throw new Error(`GitHub branch ${branch}: ${res.status}`);

  const data = await res.json();
  return data.object.sha;
}

/**
 * Create a new branch from a base.
 */
export async function createBranch(
  name: string,
  baseBranch = "main"
): Promise<string> {
  const cfg = getGHConfig();
  const baseSha = await getBranchSHA(baseBranch);

  const url = `${GITHUB_API}/repos/${cfg.owner}/${cfg.repo}/git/refs`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(cfg.token),
    body: JSON.stringify({ ref: `refs/heads/${name}`, sha: baseSha }),
  });

  if (!res.ok) {
    const err = await res.text();
    // Branch might already exist
    if (res.status === 422 && err.includes("Reference already exists")) {
      console.log(`[github] Branch ${name} already exists`);
      return baseSha;
    }
    throw new Error(`GitHub create branch: ${res.status} ${err}`);
  }

  console.log(`[github] Created branch ${name} from ${baseBranch}`);
  return baseSha;
}

/**
 * Commit multiple files to a branch using the Git Data API.
 */
export async function commitFiles(
  branch: string,
  files: { path: string; content: string }[],
  message: string
): Promise<{ sha: string; url: string }> {
  const cfg = getGHConfig();
  const h = headers(cfg.token);
  const base = `${GITHUB_API}/repos/${cfg.owner}/${cfg.repo}`;

  // 1. Get the current commit SHA for the branch
  const branchSha = await getBranchSHA(branch);

  // 2. Get the tree SHA from that commit
  const commitRes = await fetch(`${base}/git/commits/${branchSha}`, { headers: h });
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs for each file
  const tree = [];
  for (const file of files) {
    const blobRes = await fetch(`${base}/git/blobs`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
    });
    const blobData = await blobRes.json();
    tree.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  // 4. Create a new tree
  const treeRes = await fetch(`${base}/git/trees`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
  const treeData = await treeRes.json();

  // 5. Create the commit
  const newCommitRes = await fetch(`${base}/git/commits`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [branchSha],
    }),
  });
  const newCommitData = await newCommitRes.json();

  // 6. Update the branch reference
  await fetch(`${base}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({ sha: newCommitData.sha }),
  });

  console.log(`[github] Committed ${files.length} files to ${branch}: ${newCommitData.sha}`);
  return {
    sha: newCommitData.sha,
    url: `https://github.com/${cfg.owner}/${cfg.repo}/commit/${newCommitData.sha}`,
  };
}
