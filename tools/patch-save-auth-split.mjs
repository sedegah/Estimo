import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// guests keep work in the basket; signed-in users file it under Saved projects
text = text.replace(
  "  const saveEstimateNow = async () => {",
  "  const saveEstimateNow = async () => {\n    if (!props.signedIn) return null;",
);

const oldBlock = text.match(/  \/\*\* Saves the estimate to Saved projects[\s\S]*?\n  \};/);
if (!oldBlock) throw new Error("save block not found");

const newBlock = `  /**
   * Signed in: the estimate is filed under Saved projects and leaves the basket.
   * Signed out: it stays in the basket, because there is no account to keep it.
   */
  const addToEstimate = async () => {
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

    if (props.signedIn) {
      const saved = await saveEstimateNow();
      if (!saved) return;
      writeBasket(readBasket().filter((item) => item.groupId !== groupId));
      setAdded(\`\${lines_.length} materials saved to your account.\`);
      return;
    }

    if (!lines_.length) return;
    const rest = readBasket().filter(
      (item) => !(item.groupId === groupId && lines_.some((line) => line.materialId === item.materialId)),
    );
    writeBasket([...rest, ...lines_]);
    setAdded(\`\${lines_.length} materials added to your estimate basket.\`);
  };`;

text = text.replace(oldBlock[0], newBlock);

// the confirmation points at wherever the work now lives
text = text.replace(
  `{added} <Link href="/projects">Saved estimates</Link>`,
  `{added} <Link href={props.signedIn ? "/projects" : "/estimate-basket"}>{props.signedIn ? "Saved estimates" : "Open the basket"}</Link>`,
);

fs.writeFileSync(path, text);
console.log("guests keep the basket, signed-in users get Saved projects");
