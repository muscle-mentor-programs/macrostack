// Retain the content during closing so both directions can animate. Inert keeps
// collapsed controls out of keyboard navigation without remounting their forms.
export default function Collapse({open, children}) {
  return <div className="ms-collapse" data-open={Boolean(open)} inert={!open} aria-hidden={!open}>
    <div className="ms-collapse-inner">{children}</div>
  </div>;
}
