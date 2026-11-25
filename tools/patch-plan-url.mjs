import fs from "node:fs";

// 1) the simple page hands its plan over in the URL, so the itemized screen opens
//    with exactly those spaces without relying on storage timing
const simplePath = "app/quick-estimate/page.tsx";
let simple = fs.readFileSync(simplePath, "utf8").replace(/\r\n/g, "\n");

simple = simple.replace(
  `  /** The itemized screen opens with exactly this plan, so the totals match. */
  const openItemized = () => {
    try {
      localStorage.setItem(
        "estimo_estimate_draft_v1",
        JSON.stringify({
          templateId,
          specLevel,
          spaces: planSpaces,
          overrides: [],
          loads: [],
        }),
      );
    } catch {}
    router.push(\`/itemized?template=\${encodeURIComponent(type.code)}&quality=\${quality}\`);
  };`,
  `  /** The itemized screen opens with exactly this plan, so the totals match. */
  const openItemized = () => {
    const plan = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(planSpaces)))));
    router.push(
      \`/itemized?template=\${encodeURIComponent(type.code)}&quality=\${quality}&plan=\${plan}\`,
    );
  };`,
);
fs.writeFileSync(simplePath, simple);

// 2) the itemized page passes the decoded plan into the view
const itemizedPath = "app/itemized/page.tsx";
let itemized = fs.readFileSync(itemizedPath, "utf8").replace(/\r\n/g, "\n");

itemized = itemized.replace(
  `  searchParams: Promise<{ template?: string; quality?: string }>;`,
  `  searchParams: Promise<{ template?: string; quality?: string; plan?: string }>;`,
);
itemized = itemized.replace(
  `  const { template, quality } = await searchParams;`,
  `  const { template, quality, plan } = await searchParams;`,
);
itemized = itemized.replace(
  `  const specLevelFromQuality = quality === "premium" ? "premium" : quality === "basic" ? "economy" : "standard";`,
  `  const specLevelFromQuality = quality === "premium" ? "premium" : quality === "basic" ? "economy" : "standard";

  // A plan from the simple screen travels in the URL; anything malformed is ignored.
  let planSpaces: unknown[] = [];
  if (plan) {
    try {
      const decoded = JSON.parse(Buffer.from(decodeURIComponent(plan), "base64").toString("utf8"));
      if (Array.isArray(decoded)) planSpaces = decoded;
    } catch {
      planSpaces = [];
    }
  }`,
);
itemized = itemized.replace(
  `          initialSpecLevel={specLevelFromQuality}`,
  `          initialSpecLevel={specLevelFromQuality}
          initialSpaces={planSpaces as never}`,
);
fs.writeFileSync(itemizedPath, itemized);

// 3) the view can be opened on a given plan
const viewPath = "components/quantities/quantity-view.tsx";
let view = fs.readFileSync(viewPath, "utf8").replace(/\r\n/g, "\n");
view = view.replace(
  "  initialSpecLevel?: SpecLevel;",
  "  initialSpecLevel?: SpecLevel;\n  initialSpaces?: SpaceInput[];",
);
view = view.replace(
  "  const [spaces, setSpaces] = useState<SpaceInput[]>(props.spacesByTemplate[firstTemplate.id] ?? []);",
  "  const [spaces, setSpaces] = useState<SpaceInput[]>(\n    props.initialSpaces?.length ? props.initialSpaces : (props.spacesByTemplate[firstTemplate.id] ?? []),\n  );",
);
view = view.replace(
  `  useEffect(() => {
    try {
      const raw = localStorage.getItem("estimo_estimate_draft_v1");`,
  `  useEffect(() => {
    // an explicit plan from the simple screen wins over whatever was drafted
    if (props.initialSpaces?.length) return;
    try {
      const raw = localStorage.getItem("estimo_estimate_draft_v1");`,
);
fs.writeFileSync(viewPath, view);
console.log("plan travels in the URL");
