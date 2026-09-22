import BrandWordmark from "./BrandWordmark";
import "./LoadingSplash.css";

export default function LoadingSplash({
  label = "Loading your workspace…",
  fullScreen = false,
}) {
  return (
    <div
      className={`loading-splash${fullScreen ? " loading-splash-full" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-splash-content">
        <img src="/macrostack-mark-transparent.png" alt="" aria-hidden="true" />
        <BrandWordmark />
        <div className="loading-splash-track" aria-hidden="true">
          <span />
        </div>
        <p>{label}</p>
      </div>
    </div>
  );
}
