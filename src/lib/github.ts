import type { GeneratedCodeFile } from "./types";

export const GITHUB_TOKEN_COOKIE = "cs_gh_token";
export const GITHUB_STATE_COOKIE = "cs_gh_state";
// Le jeton ne sert qu'à créer le dépôt : durée courte, et lu seulement depuis le tableau de bord.
export const GITHUB_TOKEN_PATH = "/dashboard";
export const GITHUB_TOKEN_MAX_AGE = 60 * 60;

const API = "https://api.github.com";
const MAX_FILE_BYTES = 300_000;
const MAX_FILES = 20;

export function templateRepo(): string {
  return process.env.GITHUB_TEMPLATE_REPO ?? "myxmoney2-crypto/cashsaas-template";
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export class GithubError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
  }
}

/** « ClosePack » → « closepack » ; jamais vide. */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return slug || "mon-saas";
}

// Ce que le modèle a le droit d'écrire dans le dépôt : du contenu de site, jamais la config de build
// du template, un workflow GitHub Actions ou un fichier caché.
const BLOCKED = new Set(["package.json", "package-lock.json", "vercel.json", "scripts/build.mjs"]);
const ALLOWED_EXT = /\.(html|css|js|json|sql|md|txt|svg|xml|webmanifest)$/i;

export function isAllowedPath(path: string): boolean {
  if (path.length === 0 || path.length > 120 || path.startsWith("/") || path.includes("\\")) return false;
  const parts = path.split("/");
  if (parts.length > 4) return false;
  if (parts.some((part) => part === "" || part.startsWith(".") || part === "..")) return false;
  if (BLOCKED.has(path) || path.startsWith("scripts/")) return false;
  return ALLOWED_EXT.test(path);
}

export function selectFiles(files: GeneratedCodeFile[]): GeneratedCodeFile[] {
  return files
    .filter(
      (file) =>
        typeof file.path === "string" &&
        typeof file.content === "string" &&
        isAllowedPath(file.path) &&
        Buffer.byteLength(file.content, "utf8") <= MAX_FILE_BYTES
    )
    .slice(0, MAX_FILES)
    // index.html d'abord : c'est lui qui attend que la copie du template soit prête chez GitHub.
    .sort((a, b) => Number(b.path === "index.html") - Number(a.path === "index.html"));
}

async function gh(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "cashsaas",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Crée un dépôt PUBLIC à partir du template, chez la personne (le premier nom libre parmi nom, nom-2...). */
export async function createRepoFromTemplate(
  token: string,
  baseName: string,
  description: string
): Promise<{ owner: string; name: string; url: string }> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const name = attempt === 1 ? baseName : `${baseName}-${attempt}`;
    const res = await gh(token, `/repos/${templateRepo()}/generate`, {
      method: "POST",
      body: JSON.stringify({ name, description: description.slice(0, 300), private: false }),
    });
    if (res.ok) {
      const data = (await res.json()) as { name: string; html_url: string; owner: { login: string } };
      return { owner: data.owner.login, name: data.name, url: data.html_url };
    }
    // 422 = ce nom existe déjà chez la personne : on essaie le suivant.
    if (res.status === 422 && attempt < 5) continue;
    if (res.status === 401) throw new GithubError("Ta connexion GitHub a expiré.", 401);
    if (res.status === 403 || res.status === 404) {
      throw new GithubError("GitHub a refusé la création du dépôt (autorisation insuffisante).", res.status);
    }
    throw new GithubError(`GitHub a répondu ${res.status} à la création du dépôt.`, res.status);
  }
  throw new GithubError("Impossible de trouver un nom de dépôt libre.");
}

/** Écrit (crée ou remplace) les fichiers du dépôt, un commit par fichier. */
export async function pushFiles(
  token: string,
  owner: string,
  repo: string,
  files: GeneratedCodeFile[]
): Promise<void> {
  for (const file of files) {
    const target = `/repos/${owner}/${repo}/contents/${file.path.split("/").map(encodeURIComponent).join("/")}`;

    // La copie du template est asynchrone côté GitHub : on réessaie quelques secondes avant de lire.
    let sha: string | undefined;
    for (let attempt = 0; attempt < 8; attempt++) {
      const existing = await gh(token, target);
      if (existing.ok) {
        sha = ((await existing.json()) as { sha: string }).sha;
        break;
      }
      if (existing.status === 404 && file.path !== "index.html") break; // fichier nouveau : rien à remplacer
      await sleep(1000);
    }

    const res = await gh(token, target, {
      method: "PUT",
      body: JSON.stringify({
        message: `Ajoute ${file.path} généré par CashSaaS`,
        content: Buffer.from(file.content, "utf8").toString("base64"),
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) throw new GithubError(`Impossible d'écrire ${file.path} (GitHub ${res.status}).`, res.status);
  }
}
