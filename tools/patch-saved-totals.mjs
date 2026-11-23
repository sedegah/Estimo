import fs from "node:fs";

const path = "app/(app)/projects/[id]/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldTable = `              </tbody>
            </table>
          </section>
        ) : null}
        {takeOff.specialLoads?.length ? (`;

const newTable = `              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th />
                  <th />
                  <th className="align-right">
                    {project.totalGhs != null
                      ? formatGhs(project.totalGhs)
                      : formatGhs(project.items.reduce((sum, line) => sum + (line.priceGhs == null ? 0 : line.priceGhs * line.quantity), 0))}
                  </th>
                </tr>
              </tfoot>
            </table>
            {project.items.some((line) => line.priceGhs == null) ? (
              <p className="settings-note" style={{ padding: "10px 16px" }}>
                Lines marked Pending still wait for a catalogue price.
              </p>
            ) : null}
          </section>
        ) : (
          <p className="settings-note">This estimate was saved before its material list was recorded.</p>
        )}
        {takeOff.specialLoads?.length ? (`;

if (!text.includes(oldTable)) throw new Error("materials table anchor missing");
text = text.replace(oldTable, newTable);
fs.writeFileSync(path, text);
console.log("saved materials table: total row and empty state added");
