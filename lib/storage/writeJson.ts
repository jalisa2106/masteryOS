import fs from 'fs';
import path from 'path';
import { Octokit } from 'octokit';

// Module-level singleton: reused across calls within the same warm Vercel instance.
// Lazy-initialised so it is only created when a production write actually happens.
let _octokit: Octokit | null = null;
function getOctokit(): Octokit {
  if (!_octokit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is not set.');
    _octokit = new Octokit({ auth: token });
  }
  return _octokit;
}

/**
 * Writes a JSON file to the /data directory.
 * In development, writes directly to the local filesystem.
 * In production (Vercel), commits the file to GitHub using the REST API.
 *
 * NOTE: The previous setTimeout/debounce approach was removed because Vercel
 * serverless functions are terminated immediately after the HTTP response is sent.
 * Any setTimeout callback scheduled in a fire-and-forget manner will never
 * execute. The GitHub commit is now awaited directly to guarantee it completes.
 */
export async function writeJson<T>(relativePath: string, data: T): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), 'data', relativePath);
  const jsonString = JSON.stringify(data, null, 2);

  if (!isProd) {
    // Development: Write directly to filesystem
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, jsonString, 'utf-8');
    return;
  }

  // Production: Commit to GitHub via API (synchronously awaited)
  const octokit = getOctokit();
  const owner = process.env.GITHUB_OWNER || 'Sp2736';
  const repo = process.env.GITHUB_REPO || 'mastery-os';
  const githubPath = `data/${relativePath}`;

  // 1. Get current file SHA for updating (required by GitHub API for updates)
  let sha: string | undefined = undefined;
  try {
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: githubPath,
    });
    if (!Array.isArray(fileData) && fileData.type === 'file') {
      sha = fileData.sha;
    }
  } catch (e: any) {
    if (e.status !== 404) {
      // 404 means file doesn't exist yet (new file) — that's fine, sha stays undefined.
      // Any other error is unexpected and should be re-thrown.
      throw e;
    }
  }

  // 2. Commit the new contents
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: githubPath,
    message: `chore(data): update ${relativePath} — ${new Date().toISOString()}`,
    content: Buffer.from(jsonString).toString('base64'),
    sha,
  });
}

/**
 * Helper to write a user-specific JSON file securely.
 */
export async function writeUserJson<T>(userId: string, filename: string, data: T): Promise<void> {
  if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error('Invalid user ID. Path traversal prevented.');
  }
  return writeJson<T>(`users/${userId}/${filename}`, data);
}
