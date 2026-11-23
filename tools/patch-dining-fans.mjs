import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

if (text.includes("MUST_HAVE_POINTS")) {
  console.log("dining fan default already present");
} else {
  const anchor = "  const roomTypes = useMemo(";
  if (!text.includes(anchor)) throw new Error("room types anchor missing");

  const block = `  /**
   * A dining room always gets a ceiling fan. It is written as an editable override,
   * so the rule set stays as published and the person can still set it to 0.
   */
  useEffect(() => {
    setOverrides((current) => {
      const missing = spaces
        .filter((space) => space.room_type === "dining_room")
        .filter((space) => !current.some((entry) => entry.space_id === space.id && entry.point_type === "fans"));
      if (!missing.length) return current;
      return [
        ...current,
        ...missing.map((space) => ({ space_id: space.id, point_type: "fans" as PointType, value: 1, source: "template_default" })),
      ];
    });
  }, [spaces]);

`;

  text = text.replace(anchor, block + anchor);
  fs.writeFileSync(path, text);
  console.log("dining rooms default to one fan point");
}
