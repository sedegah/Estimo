// Applies the generated supplier prices to the ESTIMO D1 database.
//
//   node tools/apply-catalogue-prices.mjs             # migration + items + prices
//   node tools/apply-catalogue-prices.mjs --dry-run   # print what would run
//   node tools/apply-catalogue-prices.mjs --deploy    # also deploy the API worker
//
// Credentials, in order of preference:
//   1. CLOUDFLARE_API_TOKEN in .env (headless, CI);
//   2. an existing `wrangler login` session on this machine.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const deploy = args.includes("--deploy");

const envPath = path.join(root, ".env");
const env = fs.existsSync(envPath)
  ? Object.fromEntries(
      fs.readFileSync(envPath, "utf8")
        .split(/\r?\n/)
        .filter((line) => /^[A-Z0-9_]+=/.test(line))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1).trim()];
        }),
    )
  : {};

const accountId = env.CLOUDFLARE_ACCOUNT_ID;
const token = env.CLOUDFLARE_API_TOKEN;
const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;
const databaseName = env.CLOUDFLARE_D1_DATABASE_NAME || "estimo";
const config = path.join("worker", "api", "wrangler.toml");
const useApi = Boolean(accountId && token && databaseId);

const api = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;

async function query(sql) {
  const response = await fetch(`${api}/d1/database/${databaseId}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body.errors?.map((error) => `${error.code}: ${error.message}`).join("; ") || response.statusText;
    throw new Error(message);
  }
  return body.result;
}

/** Splits a seed file into statements, dropping comment-only lines. */
function statements(file) {
  return fs.readFileSync(file, "utf8")
    .split(/;\s*\n/)
    .map((statement) => statement
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

/** Runs wrangler through the shell so it works the same on Windows and POSIX. */
function runWrangler(argumentsLine, options = {}) {
  return execSync(`npx -y wrangler@latest ${argumentsLine}`, { cwd: root, encoding: "utf8", ...options });
}

function wranglerExecute(file) {
  try {
    runWrangler(`d1 execute ${databaseName} --remote --file="${file}" --config="${config}"`, { stdio: "pipe" });
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    // the brand column may already exist on a database set up earlier
    if (/duplicate column name/i.test(output)) return;
    throw new Error(output.split("\n").slice(-12).join("\n") || error.message);
  }
}

const files = [
  ["migration 0006 (brand column)", path.join(root, "lib", "db", "migrations", "0006_catalogue_price_brand.sql")],
  ["catalogue items", path.join(root, "lib", "db", "seed-catalogue.sql")],
  ["supplier prices", path.join(root, "lib", "db", "seed-prices-electrical-supplies.sql")],
];

console.log(useApi ? "using CLOUDFLARE_API_TOKEN from .env" : "using the local wrangler login");

for (const [label, file] of files) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}. Run tools/apply-supplier-prices.mjs first.`);
    process.exit(1);
  }

  const batch = statements(file);
  console.log(`${label}: ${batch.length} statements`);
  if (dryRun) {
    console.log(`  ${batch[0]?.slice(0, 120)}...`);
    continue;
  }

  if (!useApi) {
    wranglerExecute(file);
    console.log("  applied via wrangler");
    continue;
  }

  for (const sql of batch) {
    try {
      await query(sql);
    } catch (error) {
      if (/duplicate column name/i.test(error.message)) continue;
      console.error(`Failed on: ${sql.slice(0, 160)}...`);
      console.error(error.message);
      process.exit(1);
    }
  }
  console.log("  applied via API");
}

if (dryRun) {
  console.log("dry run — nothing sent");
  process.exit(0);
}

if (deploy) {
  console.log("deploying the API worker...");
  runWrangler(`deploy --config="${config}"`, { stdio: "inherit" });
}

console.log("prices are in D1; the worker serves them at GET /catalogue");
