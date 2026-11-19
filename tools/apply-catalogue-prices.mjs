// Applies the generated supplier prices to the ESTIMO D1 database.
//
//   node tools/apply-catalogue-prices.mjs            # migration + prices
//   node tools/apply-catalogue-prices.mjs --dry-run  # print what would run
//
// Needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and CLOUDFLARE_D1_DATABASE_ID
// in .env (the same values tools/d1-setup.mjs uses).
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");

const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env with CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and CLOUDFLARE_D1_DATABASE_ID.");
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).trim()];
    }),
);

const accountId = env.CLOUDFLARE_ACCOUNT_ID;
const token = env.CLOUDFLARE_API_TOKEN;
const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;

if (!dryRun && (!accountId || !token || !databaseId)) {
  console.error("CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and CLOUDFLARE_D1_DATABASE_ID must be set in .env.");
  process.exit(1);
}

const api = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function query(sql) {
  const response = await fetch(`${api}/d1/database/${databaseId}/query`, {
    method: "POST",
    headers,
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

const migration = path.join(root, "lib", "db", "migrations", "0006_catalogue_price_brand.sql");
const seed = path.join(root, "lib", "db", "seed-prices-electrical-supplies.sql");

for (const [label, file] of [["migration 0006", migration], ["catalogue items", path.join(root, "lib", "db", "seed-catalogue.sql")], ["supplier prices", seed]]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}. Run tools/apply-supplier-prices.mjs first.`);
    process.exit(1);
  }
  const batch = statements(file);
  console.log(`${label}: ${batch.length} statements`);

  if (dryRun) {
    console.log(batch.slice(0, 2).join("\n"));
    continue;
  }

  for (const sql of batch) {
    try {
      await query(sql);
    } catch (error) {
      // the migration column may already exist on a database that was set up earlier
      if (/duplicate column name/i.test(error.message)) continue;
      console.error(`Failed on: ${sql.slice(0, 160)}...`);
      console.error(error.message);
      process.exit(1);
    }
  }
  console.log(`  applied`);
}

console.log(dryRun ? "dry run — nothing sent" : "prices are in D1; the worker now serves them at GET /catalogue");
