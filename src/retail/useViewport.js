import { useEffect } from "react";
export default function useViewport() {
  useEffect(() => {
    let frame = 0;
    const root = document.documentElement;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const v = window.visualViewport;
        root.style.setProperty(
          "--retail-height",
          `${v?.height || innerHeight}px`,
        );
        root.style.setProperty("--retail-top", `${v?.offsetTop || 0}px`);
        root.classList.toggle(
          "retail-keyboard",
          !!v && innerHeight - v.height > 150,
        );
      });
    };
    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      root.style.removeProperty("--retail-height");
      root.style.removeProperty("--retail-top");
      root.classList.remove("retail-keyboard");
    };
  }, []);
}
