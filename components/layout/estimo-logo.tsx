/** Official ESTIMO logo assets (from the brand pack) used as plain images. */

type LogoVariant = "dark" | "light";

const HORIZONTAL: Record<LogoVariant, string> = {
  // "dark" artwork is drawn for dark backgrounds (white wordmark, amber dots).
  dark: "/brand/estimo-logo-horizontal-dark.svg",
  light: "/brand/estimo-logo-horizontal-light.svg",
};

export function EstimoLogo({ variant = "dark", height = 28 }: { variant?: LogoVariant; height?: number }) {
  return (
    <img
      src={HORIZONTAL[variant]}
      alt="ESTIMO"
      height={height}
      style={{ height, width: "auto", display: "block" }}
    />
  );
}

export function EstimoStackedLogo({ variant = "light", height = 120 }: { variant?: LogoVariant; height?: number }) {
  const src = variant === "dark" ? "/brand/estimo-logo-stacked-dark.svg" : "/brand/estimo-logo-stacked-light.svg";
  return <img src={src} alt="ESTIMO" height={height} style={{ height, width: "auto", display: "block" }} />;
}

export function EstimoAppIcon({ size = 96 }: { size?: number }) {
  return (
    <img
      src="/brand/estimo-app-icon-amber.svg"
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, display: "block", borderRadius: size * 0.22 }}
    />
  );
}
