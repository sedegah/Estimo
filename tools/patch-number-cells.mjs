import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// a cell that lets you clear it and type a fresh value, committing when valid
const helper = `/** Dimensions and quantities may be cleared while typing; values commit when valid. */
function NumberCell({ value, min, step, onCommit }: { value: number; min: number; step: number; onCommit: (next: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const next = Number(raw);
        if (raw !== "" && Number.isFinite(next) && next >= min) onCommit(next);
      }}
      onBlur={() => {
        const next = Number(text);
        if (text === "" || !Number.isFinite(next) || next < min) {
          onCommit(min);
          setText(String(min));
        } else {
          onCommit(next);
        }
      }}
    />
  );
}

`;
if (!text.includes("function NumberCell")) {
  text = text.replace("const tidyNames", helper + "const tidyNames");
}

const replacements = [
  [
    `                      <input
                        type="number" min={1} step={0.1} value={source.length_m}
                        onChange={(event) => updateSpace(space.space_id, { length_m: Math.max(1, Number(event.target.value) || 1) })}
                      />`,
    `                      <NumberCell
                        value={source.length_m}
                        min={1}
                        step={0.1}
                        onCommit={(next) => updateSpace(space.space_id, { length_m: next })}
                      />`,
  ],
  [
    `                      <input
                        type="number" min={1} step={0.1} value={source.width_m}
                        onChange={(event) => updateSpace(space.space_id, { width_m: Math.max(1, Number(event.target.value) || 1) })}
                      />`,
    `                      <NumberCell
                        value={source.width_m}
                        min={1}
                        step={0.1}
                        onCommit={(next) => updateSpace(space.space_id, { width_m: next })}
                      />`,
  ],
  [
    `                      <input
                        type="number" min={2} step={0.1} value={source.height_m}
                        onChange={(event) => updateSpace(space.space_id, { height_m: Math.max(2, Number(event.target.value) || 2) })}
                      />`,
    `                      <NumberCell
                        value={source.height_m}
                        min={2}
                        step={0.1}
                        onCommit={(next) => updateSpace(space.space_id, { height_m: next })}
                      />`,
  ],
  [
    `                      <input
                        type="number" min={1} step={1} value={source.quantity ?? 1}
                        onChange={(event) => updateSpace(space.space_id, { quantity: Math.max(1, Math.round(Number(event.target.value) || 1)) })}
                      />`,
    `                      <NumberCell
                        value={source.quantity ?? 1}
                        min={1}
                        step={1}
                        onCommit={(next) => updateSpace(space.space_id, { quantity: Math.max(1, Math.round(next)) })}
                      />`,
  ],
];

for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error("input block not found: " + from.slice(0, 60));
  text = text.replace(from, to);
}

fs.writeFileSync(path, text);
console.log("dimension cells can be cleared");
