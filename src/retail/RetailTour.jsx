import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";
import { retailTourSteps } from "./retailTourModel.mjs";
import "./retail-tour.css";

export default function RetailTour({ index, onStep, onClose, onNavigate }) {
  const step = retailTourSteps[index];
  const [spotlight, setSpotlight] = useState(null);
  const [moving, setMoving] = useState(false);
  const [navigationError, setNavigationError] = useState("");
  const nextRef = useRef(null);
  const move = useCallback(async (next) => {
    if (moving) return;
    if (next >= retailTourSteps.length) { onClose(); return; }
    setMoving(true);
    setNavigationError("");
    try {
      await onNavigate(retailTourSteps[next]);
      onStep(next);
    } catch (error) {
      setNavigationError(error?.message || "Could not open this section. Please try again.");
    } finally { setMoving(false); }
  }, [moving, onClose, onNavigate, onStep]);
  useEffect(() => {
    nextRef.current?.focus();
    const focusTarget = () => {
      const target = document.querySelector(step.target);
      if (!target) { setSpotlight(null); return; }
      const box = target.getBoundingClientRect();
      if (box.bottom < 40 || box.top > window.innerHeight - 60) {
        target.scrollIntoView({ block: "center", behavior: "instant" });
      }
      const rect = target.getBoundingClientRect();
      const inset = 9;
      const bottomInset = step.spotlightBottomInset ?? inset;
      const top = Math.max(8, rect.top - inset);
      const bottom = Math.min(window.innerHeight - 8, rect.bottom + bottomInset);
      setSpotlight({
        top,
        left: Math.max(8, rect.left - inset),
        width: Math.min(window.innerWidth - 16, rect.width + inset * 2),
        height: Math.max(0, bottom - top),
      });
    };
    const frame = requestAnimationFrame(focusTarget);
    const observer = new MutationObserver(focusTarget);
    observer.observe(document.querySelector(".retail-workspace") || document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", focusTarget, true);
    window.addEventListener("resize", focusTarget);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", focusTarget, true);
      window.removeEventListener("resize", focusTarget);
    };
  }, [index, step.target, step.spotlightBottomInset]);
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); void move(index - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); void move(index + 1); }
      if (event.key === "Tab") {
        const controls = [...document.querySelectorAll(".retail-tour-dialog button:not(:disabled)")];
        if (!controls.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [index, onClose, move]);
  return (
    <div className="retail-tour-layer">
      <div className={spotlight ? "retail-tour-hitbox" : "retail-tour-backdrop"} aria-hidden="true" />
      {spotlight && <div className="retail-tour-spotlight" style={spotlight} aria-hidden="true" />}
      <aside className="retail-tour-dialog" role="dialog" aria-modal="true" aria-labelledby="retail-tour-title" aria-describedby="retail-tour-description">
        <div className="retail-tour-head"><span className="retail-tour-brand"><img src="/macrostack-mark-transparent.png" alt="" /> MACROSTACK RETAIL</span><button type="button" aria-label="Close walkthrough" onClick={onClose}><X size={18} /></button></div>
        <div className="retail-tour-progress" aria-label={`Step ${index + 1} of ${retailTourSteps.length}`}><span style={{ width: `${((index + 1) / retailTourSteps.length) * 100}%` }} /></div>
        <div className="retail-tour-copy" key={index}><div className="retail-tour-path">{step.path}<span>{String(index + 1).padStart(2, "0")} / {String(retailTourSteps.length).padStart(2, "0")}</span></div><h2 id="retail-tour-title">{step.title}</h2><p id="retail-tour-description">{step.body}</p></div>
        {navigationError && <p className="retail-tour-error" role="alert">{navigationError}</p>}
        <div className="retail-tour-actions"><button type="button" className="retail-tour-skip" onClick={onClose}>Explore on my own</button><div><button type="button" disabled={index === 0 || moving} onClick={() => void move(index - 1)}><ArrowLeft size={16} /> Back</button><button ref={nextRef} type="button" className="retail-tour-next" disabled={moving} onClick={() => void move(index + 1)}>{index === retailTourSteps.length - 1 ? "Finish" : "Next"}<ArrowRight size={16} /></button></div></div>
        <small>Use ← and → to move between steps. Esc closes the guide.</small>
      </aside>
    </div>
  );
}

export function ReplayRetailTour({ onClick }) {
  return <button type="button" className="retail-tour-replay" onClick={onClick}><RotateCcw size={15} aria-hidden="true" /> Replay tour</button>;
}
