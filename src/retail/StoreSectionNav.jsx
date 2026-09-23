import { useEffect, useRef, useState } from "react";

export default function StoreSectionNav({ items }) {
  const navRef = useRef(null);
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const nav = navRef.current;
    const scroller = nav?.closest(".retail");
    const primaryNav = scroller?.querySelector(".retail-nav");
    if (!nav || !scroller || !primaryNav) return;

    const measure = () => {
      scroller.style.setProperty("--retail-primary-nav-height", `${primaryNav.offsetHeight}px`);
      scroller.style.setProperty("--retail-store-subnav-height", `${nav.offsetHeight}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(primaryNav);
    observer.observe(nav);
    measure();

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = nav.getBoundingClientRect().bottom + 24;
        const passed = items
          .map(({ id }) => document.getElementById(id))
          .filter(Boolean)
          .filter((target) => target.getBoundingClientRect().top <= line);
        if (!passed.length) {
          setActive(items[0]?.id);
          return;
        }
        const latestTop = Math.max(...passed.map((target) => target.getBoundingClientRect().top));
        const nearest = passed.filter((target) => Math.abs(target.getBoundingClientRect().top - latestTop) < 4);
        setActive((current) => nearest.some((target) => target.id === current) ? current : nearest[0].id);
      });
    };
    scroller.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
      scroller.style.removeProperty("--retail-primary-nav-height");
      scroller.style.removeProperty("--retail-store-subnav-height");
    };
  }, [items]);

  const goTo = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    setActive(id);
    const link = Array.from(navRef.current?.querySelectorAll("button") || []).find((button) => button.dataset.sectionId === id);
    if (link) {
      const row = link.parentElement;
      row.scrollTo({ left: link.offsetLeft - (row.clientWidth - link.clientWidth) / 2, behavior: "smooth" });
    }
    target.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <nav ref={navRef} className="retail-store-section-nav" aria-label="Store settings sections">
      <span className="retail-store-section-nav-label" aria-hidden="true">ON THIS PAGE</span>
      <div className="retail-store-section-nav-links">
        {items.map(({ id, label }, index) => (
          <button
            key={id}
            data-section-id={id}
            type="button"
            aria-current={active === id ? "location" : undefined}
            onClick={() => goTo(id)}
          >
            <span className="retail-store-section-nav-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
