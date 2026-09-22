const running = new WeakMap();
const expected = new WeakMap();
const easing = 'cubic-bezier(.22, 1, .36, 1)';

// Keep native details/summary semantics; only defer the final close until motion ends.
export function animateDisclosure(details, open) {
  const previous = running.get(details);
  const summary = details.querySelector(':scope > summary');
  if (!summary) return;
  const from = details.getBoundingClientRect().height;
  const children = [...details.children].filter(child => child !== summary);
  const floating = children.find(child => ['absolute', 'fixed'].includes(getComputedStyle(child).position));
  const floatingStyle = previous && floating ? {opacity: getComputedStyle(floating).opacity, transform: getComputedStyle(floating).transform} : null;
  previous?.animation.cancel();
  previous?.restore();
  const setOpen = value => { expected.set(details, value); details.open = value; };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !details.animate) {
    running.delete(details);
    setOpen(open);
    return;
  }
  const oldOverflow = details.style.overflow;
  const oldHeight = details.style.height;
  const restore = () => { details.style.overflow = oldOverflow; details.style.height = oldHeight; };
  if (!open && children.some(child => child.contains(document.activeElement))) summary.focus({preventScroll: true});
  setOpen(false);
  const closedHeight = details.getBoundingClientRect().height;
  setOpen(true);
  const fullHeight = details.getBoundingClientRect().height;
  let animation;
  if (floating) {
    animation = floating.animate([
      floatingStyle || {opacity: open ? 0 : 1, transform: open ? 'translateY(-6px)' : 'translateY(0)'},
      {opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(-6px)'},
    ], {duration: 200, easing});
  } else {
    details.style.overflow = 'clip';
    // Height uses the element's box sizing, including padded disclosure cards.
    const style = getComputedStyle(details);
    const inset = style.boxSizing === 'border-box' ? 0 :
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    animation = details.animate([
      {height: `${Math.max(0, from - inset)}px`},
      {height: `${Math.max(0, (open ? fullHeight : closedHeight) - inset)}px`},
    ], {duration: 280, easing});
  }
  const state = {animation, restore, open};
  running.set(details, state);
  animation.onfinish = () => {
    if (running.get(details) !== state) return;
    setOpen(open);
    restore();
    running.delete(details);
  };
}

export function installDisclosureMotion(root = document) {
  const click = event => {
    const summary = event.target.closest?.('summary');
    if (!summary || event.defaultPrevented || event.button > 0) return;
    if (event.target !== summary && event.target.closest('a, button, input, select, textarea')) return;
    const details = summary.parentElement;
    if (details?.tagName !== 'DETAILS') return;
    event.preventDefault();
    animateDisclosure(details, !(running.get(details)?.open ?? details.open));
  };
  root.addEventListener('click', click);
  // Also cover React-controlled disclosures and imperative outside-click closes.
  const observer = new MutationObserver(records => {
    const changed = new Set(records.filter(record => record.type === 'attributes').map(record => record.target));
    changed.forEach(details => {
      if (details.tagName !== 'DETAILS') return;
      if (expected.has(details) && expected.get(details) === details.open) return;
      const open = details.open;
      expected.set(details, !open);
      details.open = !open;
      animateDisclosure(details, open);
    });
  });
  observer.observe(root, {subtree: true, attributes: true, attributeFilter: ['open']});
  return () => { root.removeEventListener('click', click); observer.disconnect(); };
}
