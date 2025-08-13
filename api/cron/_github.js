// api/cron/_github.js
export async function putGitJson({ path, json }) {
  const owner  = process.env.GH_OWNER;
  const repo   = process.env.GH_REPO;
  const branch = process.env.GH_BRANCH || "main";
  const token  = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    throw new Error("Missing GH_OWNER / GH_REPO / GITHUB_TOKEN env");
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Узнаём sha файла (если он уже существует)
  let sha;
  {
    const r = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const cur = await r.json();
      sha = cur.sha;
    }
  }

  const content = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");
  const body = {
    message: `update ${path}`,
    content,
    branch,
    ...(sha ? { sha } : {})
  };

  const resp = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`GitHub PUT failed: ${resp.status} ${t}`);
  }
}
