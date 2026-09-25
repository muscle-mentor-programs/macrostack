import { useEffect, useRef, useState } from "react";

export function useRetailTour(isDemo, ready) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!isDemo || !ready || started.current) return;
    const frame = requestAnimationFrame(() => {
      if (started.current) return;
      started.current = true;
      setStep(0);
      setOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isDemo, ready]);
  const close = () => setOpen(false);
  const replay = () => { setStep(0); setOpen(true); };
  return { open, step, setStep, close, replay };
}
