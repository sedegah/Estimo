import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldAdd = `  const addToEstimate = () => {
    const lines_: BasketItem[] = lines.map((line) => ({
      materialId: line.catalogueId,
      name: line.catalogueName,
      category: "Quantity take-off",
      unit: line.catalogueUnit,
      quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
      priceGhs: line.unitPrice,
      brandName: line.brand,
      supplierName: "ESTIMO catalogue",
      verifiedAt: new Date().toISOString().slice(0, 10),
    }));
    if (!lines_.length) return;

    const rest = readBasket().filter((item) => !lines_.some((line) => line.materialId === item.materialId));
    writeBasket([...rest, ...lines_]);
    setAdded(\`\${lines_.length} material\${lines_.length === 1 ? "" : "s"} added to your estimate.\`);
  };`;

const newAdd = `  /** Adds the take-off to the basket and files it under Saved projects in one go. */
  const addToEstimate = () => {
    const groupId = \`qty:\${templateId}:\${specLevel}\`;
    const groupName = \`\${templateName} · \${specLevel}\`;
    const lines_: BasketItem[] = lines.map((line) => ({
      materialId: line.catalogueId,
      name: line.catalogueName,
      category: "Quantity take-off",
      unit: line.catalogueUnit,
      quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
      priceGhs: line.unitPrice,
      brandName: line.brand,
      supplierName: "ESTIMO catalogue",
      verifiedAt: new Date().toISOString().slice(0, 10),
      groupId,
      groupName,
    }));
    if (!lines_.length) return;

    // only this estimate's own lines are replaced; other estimates keep theirs
    const rest = readBasket().filter(
      (item) => !(item.groupId === groupId && lines_.some((line) => line.materialId === item.materialId)),
    );
    writeBasket([...rest, ...lines_]);

    const saved = saveEstimateNow();
    const where = props.signedIn ? "your account" : "this browser";
    setAdded(
      saved
        ? \`\${lines_.length} materials added and saved to \${where}.\`
        : \`\${lines_.length} materials added to your estimate.\`,
    );
  };`;

if (!text.includes(oldAdd)) throw new Error("addToEstimate block not found");
text = text.replace(oldAdd, newAdd);

const oldActions = `          <div className="quantities-actions">
            <button className="btn-outline" type="button" onClick={saveEstimateNow}>
              Save estimate
            </button>
            <button className="btn-amber" type="button" onClick={addToEstimate} disabled={!lines.length}>
              Add {lines.length} materials to estimate
            </button>
          </div>`;

const newActions = `          <button className="btn-amber" type="button" onClick={addToEstimate} disabled={!lines.length}>
            Add {lines.length} materials to estimate
          </button>`;

if (!text.includes(oldActions)) throw new Error("actions block not found");
text = text.replace(oldActions, newActions);

fs.writeFileSync(path, text);
console.log("add action now saves too, save button removed");
