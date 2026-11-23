import fs from "node:fs";

const path = "app/(app)/projects/[id]/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldTotal = `                  <th className="align-right">
                    {project.totalGhs != null
                      ? formatGhs(project.totalGhs)
                      : formatGhs(project.items.reduce((sum, line) => sum + (line.priceGhs == null ? 0 : line.priceGhs * line.quantity), 0))}
                  </th>`;

const newTotal = `                  <th className="align-right">
                    {project.totalGhs != null
                      ? formatGhs(project.totalGhs)
                      : formatGhs(project.items.reduce((sum, line) => sum + (line.priceGhs == null ? 0 : line.priceGhs * line.quantity), 0))}
                    <small className="muted-cell" style={{ display: "block", fontWeight: 500 }}>
                      {project.items.filter((line) => line.priceGhs != null).length} of {project.items.length} priced
                    </small>
                  </th>`;

if (!text.includes(oldTotal)) throw new Error("total cell not found");
text = text.replace(oldTotal, newTotal);
fs.writeFileSync(path, text);
console.log("saved estimate total: priced count added");
