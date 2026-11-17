export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-label="Loading ESTIMO admin">
      <img src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" className="loading-logo" />
      <span className="loading-bar"><i /></span>
    </div>
  );
}
