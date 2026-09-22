import { useEffect, useRef, useState } from "react";
export function Button({ children, primary = false, ...props }) {
  return (
    <button className={`retail-button${primary ? " primary" : ""}`} {...props}>
      {children}
    </button>
  );
}
export function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  ...props
}) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label className="retail-field">
      <span>{label}</span>
      <Tag
        {...(!multiline ? { type } : {})}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </label>
  );
}
export function Select({ label, value, onChange, children, ...props }) {
  return (
    <label className="retail-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
export function Check({ children, checked, onChange }) {
  return (
    <label className="retail-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}
export function Empty({ children }) {
  return <div className="retail-empty">{children}</div>;
}
export function Alert({ error }) {
  return error ? (
    <div className="retail-alert" role="alert">
      {error}
    </div>
  ) : null;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e.message || "Something went wrong. Please retry.");
      return null;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const key = (e) => {
      if ([...document.querySelectorAll('[role="dialog"]')].at(-1) !== ref.current) return;
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = [
          ...ref.current.querySelectorAll(
            "button:not(:disabled),input,select,textarea,a[href]",
          ),
        ];
        if (!nodes.length) return;
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="retail-modal">
      <section
        ref={ref}
        tabIndex={-1}
        className={`retail-dialog${wide ? " retail-dialog-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <Button aria-label="Close dialog" onClick={onClose}>
            ×
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
