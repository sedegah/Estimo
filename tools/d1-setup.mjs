// Create the ESTIMO D1 database and apply lib/db/schema.sql.
// Usage: node tools/d1-setup.mjs
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");

if (!fs.existsSync(envPath)) {
  console.error("Missing .env with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.");
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const accountId = env.CLOUDFLARE_ACCOUNT_ID;
const token = env.CLOUDFLARE_API_TOKEN;
const databaseName = env.CLOUDFLARE_D1_DATABASE_NAME || "estimo";

if (!accountId || !token) {
  console.error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set in .env.");
  process.exit(1);
}

const api = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function call(url, init = {}) {
  const response = await fetch(url, { headers, ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body.errors?.map((error) => `${error.code}: ${error.message}`).join("; ") || response.statusText;
    throw new Error(`Cloudflare API ${response.status} — ${message}`);
  }
  return body.result;
}

async function main() {
  const databases = await call(`${api}/d1/database`);
  const existing = databases.find((entry) => entry.name === databaseName);

  let database = existing;
  if (!database) {
    database = await call(`${api}/d1/database`, {
      method: "POST",
      body: JSON.stringify({ name: databaseName }),
    });
    console.log(`Created D1 database "${databaseName}" (${database.uuid}).`);
  } else {
    console.log(`Using existing D1 database "${databaseName}" (${database.uuid}).`);
  }

  const schema = fs.readFileSync(path.join(root, "lib", "db", "schema.sql"), "utf8");
  const statements = schema
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith("--"));

  for (const statement of statements) {
    await call(`${api}/d1/database/${database.uuid}/query`, {
      method: "POST",
      body: JSON.stringify({ sql: statement }),
    });
  }

  console.log(`Applied ${statements.length} schema statements.`);
  console.log("");
  console.log("Add this to .env (and to your host):");
  console.log(`CLOUDFLARE_D1_DATABASE_ID=${database.uuid}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
