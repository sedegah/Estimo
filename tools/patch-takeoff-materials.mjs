import fs from "node:fs";

const pagePath = "app/(app)/projects/[id]/page.tsx";
let page = fs.readFileSync(pagePath, "utf8");

const anchor = "        {takeOff.specialLoads?.length ? (";
if (!page.includes(anchor)) throw new Error("special loads anchor missing");
if (page.includes("Saved materials")) {
  console.log("materials table already present");
} else {
  const block = [
    "        {project.items?.length ? (",
    '          <section className="table-card" style={{ marginTop: 16 }}>',
    '            <div className="panel-head" style={{ padding: "14px 16px" }}><h2 style={{ margin: 0, fontSize: 15 }}>Saved materials</h2></div>',
    '            <table className="data-table">',
    "              <thead>",
    "                <tr>",
    "                  <th>Material</th>",
    "                  <th>Quantity</th>",
    '                  <th className="align-right">Unit price</th>',
    '                  <th className="align-right">Amount</th>',
    "                </tr>",
    "              </thead>",
    "              <tbody>",
    "                {project.items.map((line) => (",
    "                  <tr key={line.name}>",
    "                    <td>{line.name}</td>",
    '                    <td className="muted-cell">{line.quantity} {line.unit}</td>',
    '                    <td className="align-right">{line.priceGhs == null ? "Pending" : formatGhs(line.priceGhs)}</td>',
    '                    <td className="align-right">{line.priceGhs == null ? "—" : formatGhs(line.priceGhs * line.quantity)}</td>',
    "                  </tr>",
    "                ))}",
    "              </tbody>",
    "            </table>",
    "          </section>",
    "        ) : null}",
    "",
  ].join("\n");
  page = page.replace(anchor, block + anchor);
  fs.writeFileSync(pagePath, page);
  console.log("saved take-off: materials table added");
}
