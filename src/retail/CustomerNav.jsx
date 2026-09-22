import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";
import {primarySections,secondarySections,sectionLabel} from "./customerNavigation";
export default function CustomerNav({ tab, onChange, staff }) {
  const more=useRef(null);
  const ref = useRef(null),
    [scroll, setScroll] = useState({ width: 100, left: 0 });
  useEffect(()=>{const close=e=>{if(!more.current?.open)return;if(e.type==='keydown'&&e.key==='Escape'){more.current.open=false;more.current.querySelector('summary').focus();}else if(e.type==='pointerdown'&&!more.current.contains(e.target))more.current.open=false;};document.addEventListener('keydown',close);document.addEventListener('pointerdown',close);return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',close)}},[]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const width = (el.clientWidth / el.scrollWidth) * 100;
      setScroll({ width, left: (el.scrollLeft / el.scrollWidth) * 100 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);
  useEffect(() => {
    const el = ref.current?.querySelector('[aria-current="page"]');
    el?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [tab]);
  return (
    <div className="retail-profile-navigation">
      <nav ref={ref} className="retail-tabbar" aria-label="Customer sections">
        {primarySections.map((t) => (
          <Button
            key={t}
            primary={t === tab}
            aria-current={t === tab ? "page" : undefined}
            onClick={() => onChange(t)}
          >
            {sectionLabel(t)}
          </Button>
        ))}
      </nav>
      <details ref={more} className="retail-profile-more">
        <summary>
          {secondarySections.includes(tab) ? sectionLabel(tab) : "More"} ▾
        </summary>
        <div>
          {secondarySections
            .filter((t) => staff || t !== "Private notes")
            .map((t) => (
              <Button
                key={t}
                aria-current={t === tab ? "page" : undefined}
                onClick={(e) => {
                  onChange(t);
                  e.currentTarget.closest("details").open = false;
                }}
              >
                {sectionLabel(t)}
              </Button>
            ))}
        </div>
      </details>
      <div className="retail-profile-scroll" aria-hidden="true">
        <span
          style={{
            width: `${scroll.width}%`,
            transform: `translateX(${scroll.width ? (scroll.left / scroll.width) * 100 : 0}%)`,
          }}
        />
      </div>
    </div>
  );
}
