import { useEffect, useRef, useState } from "react";
import { RETAIL_TOUR_SEEN_KEY } from "./retailTourModel.mjs";

function readSeen() {
  try { return window.sessionStorage.getItem(RETAIL_TOUR_SEEN_KEY) === "1"; }
  catch { return false; }
}
function markSeen() {
  try { window.sessionStorage.setItem(RETAIL_TOUR_SEEN_KEY, "1"); }
  catch { /* The current visit still works if storage is unavailable. */ }
}

export function useRetailTour(isDemo, ready) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!isDemo || !ready || started.current) return;
    const frame = requestAnimationFrame(() => {
      if (started.current) return;
      started.current = true;
      if (!readSeen()) setOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isDemo, ready]);
  const close = () => { markSeen(); setOpen(false); };
  const replay = () => { setStep(0); setOpen(true); };
  return { open, step, setStep, close, replay };
}
