import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Camera, Check, ChevronRight, ClipboardCheck,
  Download, FileText, LayoutDashboard, LogOut, MessageCircle, Moon,
  RotateCcw, Search, Settings2, ShieldCheck, Sparkles, Sun, Users, X,
} from "lucide-react";
import BrandWordmark from "../components/BrandWordmark";
import { brandStyle, defaultBrandColors } from "./brandColors";
import { endRetailDemoSession, hasRetailDemoSession } from "./demoAccess.mjs";
import StoreSectionNav from "./StoreSectionNav";
import "./retail.css";
import "./retail-workspace.css";
import "./retail-demo.css";

const logo = "/macrostack-mark-transparent.png";
const people = [
  { id: "jordan", name: "Jordan Lee", email: "jordan@example.com", initials: "JL", goal: "Build strength", assigned: "Maya Chen", status: "Active", location: "Downtown" },
  { id: "taylor", name: "Taylor Reed", email: "taylor@example.com", initials: "TR", goal: "Improve consistency", assigned: "Sam Rivera", status: "Active", location: "Northside" },
  { id: "alex", name: "Alex Morgan", email: "alex@example.com", initials: "AM", goal: "Get started", assigned: "Unassigned", status: "Awaiting activation", location: "Downtown" },
];
const foodSamples = [
  { name: "Greek yogurt", amount: "1 cup", calories: 130, protein: 23, carbs: 9, fat: 0 },
  { name: "Blueberries", amount: "1 cup", calories: 84, protein: 1, carbs: 21, fat: 0 },
  { name: "Grilled chicken", amount: "4 oz", calories: 187, protein: 35, carbs: 0, fat: 4 },
];
const resourceSamples = [
  { type: "Meal plan", name: "Balanced three-day starter", detail: "Approved · Ready to personalize" },
  { type: "Intake form", name: "First visit nutrition intake", detail: "Published · Customer-facing" },
  { type: "Guide", name: "Protein and hydration basics", detail: "Published · Customer-facing" },
  { type: "Staff playbook", name: "Consultation handoff", detail: "Staff only · Internal" },
];
const mainSections = [
  { name: "Today", icon: LayoutDashboard }, { name: "Customers", icon: Users },
  { name: "Inbox", icon: MessageCircle }, { name: "Resources", icon: BookOpen },
  { name: "Store", icon: Settings2 },
];
const profileSections = ["Overview", "Nutrition", "Food journal", "Progress", "Check-ins", "Resources", "Chat", "Private notes", "Measurements"];
const storeSections = [
  { id: "demo-branding", label: "Branding" },
  { id: "demo-team", label: "Team & permissions" },
  { id: "demo-org", label: "Locations & reporting" },
  { id: "demo-billing", label: "Subscription" },
];

// Each stop shows a real destination in the demo workspace. No sample action calls a live API.
const tourSteps = [
  { view: "Today", target: "demo-brand", path: "Your workspace", title: "Welcome to MacroStack Retail", body: "This is a guided, read-only tour of a store workspace. Every name and record is sample data. Use Next and Back to move through the experience, or exit and explore on your own." },
  { view: "Today", target: "demo-priorities", path: "Today", title: "Start with what needs attention", body: "See open conversations, follow-ups and customers waiting to activate. The daily queue gives each team member a clear next action." },
  { view: "Customers", target: "demo-directory", path: "Customers", title: "Keep customers organized", body: "Search the directory, switch between cards and a compact list, and see status, goal, assigned specialist and store at a glance." },
  { view: "Customers", customer: true, tab: "Overview", target: "demo-consultation", path: "Customers › Jordan › Overview", title: "Carry consultations forward", body: "One customer record connects intake details, goals, private staff notes, a consultation history and scheduled follow-ups." },
  { view: "Customers", customer: true, tab: "Nutrition", target: "demo-targets", path: "Customers › Jordan › Nutrition", title: "Set personalized nutrition", body: "Set protein, carbs and fat targets; the calorie total follows the macros. Publish a plan and guidance directly to the connected customer." },
  { view: "Customers", customer: true, tab: "Nutrition", target: "demo-food-builder", path: "Customers › Jordan › Nutrition", title: "Build plans from the food database", body: "Search real foods, choose portions and assemble meals. Reusable plans can be personalized here, then exported as a store-branded PDF." },
  { view: "Customers", customer: true, tab: "Food journal", target: "demo-food-journal", path: "Customers › Jordan › Food journal", title: "Review daily food logs", body: "Each day expands to show meals and daily totals, making adherence and patterns easier to discuss at the next visit." },
  { view: "Customers", customer: true, tab: "Progress", target: "demo-progress", path: "Customers › Jordan › Progress", title: "Follow progress between visits", body: "Review measurements and shared progress photos in one place. Staff can request new photos and record manual assessment results." },
  { view: "Customers", customer: true, tab: "Check-ins", target: "demo-checkins", path: "Customers › Jordan › Check-ins", title: "Turn check-ins into action", body: "Read customer updates, note barriers and connect the next review date to a follow-up for the assigned specialist." },
  { view: "Customers", customer: true, tab: "Resources", target: "demo-shared-resources", path: "Customers › Jordan › Resources", title: "Share the right materials", body: "Send a tailored plan, intake form or education guide from the company library. The customer sees their shared resources in their own account." },
  { view: "Customers", customer: true, tab: "Chat", target: "demo-customer-chat", path: "Customers › Jordan › Chat", title: "Stay connected in customer chat", body: "The store conversation lives alongside the customer's coach chat when they have both. Store staff can answer questions and keep the relationship moving." },
  { view: "Inbox", target: "demo-inbox", path: "Inbox", title: "Work through conversations together", body: "The inbox brings store conversations into one team view. Open a thread, see the customer context and respond from the workspace." },
  { view: "Resources", target: "demo-library", path: "Resources", title: "Build a reusable company library", body: "Management can prepare meal-plan templates, forms, guides and staff playbooks once, then share the approved version across locations." },
  { view: "Store", target: "demo-branding", path: "Store › Branding", title: "Make the portal yours", body: "A company administrator sets the transparent logo, display name and colors once. The identity carries across stores and customer-facing materials." },
  { view: "Store", target: "demo-team", path: "Store › Team & permissions", title: "Give each person the right access", body: "Invite employees, assign them to locations and give management, specialist or associate permissions that fit their work." },
  { view: "Store", target: "demo-org", path: "Store › Locations & reporting", title: "See the whole chain", body: "Switch between stores and compare customer activity, consultations, follow-ups and adoption across the organization." },
  { view: "Store", target: "demo-billing", path: "Store › Subscription", title: "Manage store subscriptions", body: "Keep billing contacts and store activation together in settings. Each location's subscription can be reviewed by management." },
  { view: "Today", target: "demo-brand", path: "Tour complete", title: "Ready to explore?", body: "Use the portal navigation to revisit any sample screen. The Replay tour button is always available, and Exit demo returns to retailer sign-in." },
];

function Avatar({ person, size = "normal" }) {
  return <span className={`retail-demo-avatar ${size === "large" ? "large" : ""}`} aria-hidden="true">{person.initials}</span>;
}
function DemoPanel({ id, title, eyebrow, children, focused, className = "" }) {
  return <section id={id} className={`retail-demo-panel ${focused ? "retail-demo-focus" : ""} ${className}`}>
    {eyebrow && <span className="retail-demo-eyebrow">{eyebrow}</span>}
    {title && <h2>{title}</h2>}
    {children}
  </section>;
}
function DemoButton({ children, onClick, primary = false, icon: Icon, className = "", disabled = false }) {
  return <button type="button" className={`retail-demo-button ${primary ? "primary" : ""} ${className}`} onClick={onClick} disabled={disabled}>
    {Icon && <Icon size={16} aria-hidden="true" />}{children}
  </button>;
}
function TourDialog({ step, index, onBack, onNext, onClose, nextRef }) {
  return <div className="retail-demo-tour-layer">
    <div className="retail-demo-tour-blur" aria-hidden="true" />
    <aside className="retail-demo-tour" role="dialog" aria-modal="true" aria-labelledby="retail-demo-tour-title" aria-describedby="retail-demo-tour-body">
      <div className="retail-demo-tour-top"><span className="retail-demo-tour-brand"><img src={logo} alt="" /> MACROSTACK RETAIL</span><button type="button" aria-label="Close guided tour" onClick={onClose}><X size={18} /></button></div>
      <div className="retail-demo-tour-progress" aria-label={`Tour step ${index + 1} of ${tourSteps.length}`}><span style={{ width: `${((index + 1) / tourSteps.length) * 100}%` }} /></div>
      <div key={index} className="retail-demo-tour-copy">
        <span className="retail-demo-tour-path">{step.path}</span>
        <span className="retail-demo-tour-count">{String(index + 1).padStart(2, "0")} / {String(tourSteps.length).padStart(2, "0")}</span>
        <h2 id="retail-demo-tour-title">{step.title}</h2>
        <p id="retail-demo-tour-body">{step.body}</p>
      </div>
      <div className="retail-demo-tour-actions">
        <button type="button" className="retail-demo-tour-skip" onClick={onClose}>Explore on my own</button>
        <div><DemoButton onClick={onBack} icon={ArrowLeft} className="retail-demo-tour-back" disabled={index === 0}>Back</DemoButton>
          <button ref={nextRef} type="button" className="retail-demo-button primary" onClick={onNext}>{index === tourSteps.length - 1 ? "Finish tour" : "Next"}<ArrowRight size={16} aria-hidden="true" /></button></div>
      </div>
      <small>Use ← and → to move between steps. Press Esc to explore.</small>
    </aside>
  </div>;
}

export default function RetailDemo() {
  const allowed = hasRetailDemoSession(window.sessionStorage);
  const rootRef = useRef(null);
  const nextRef = useRef(null);
  const [appearance, setAppearance] = useState("light");
  const [view, setView] = useState("Today");
  const [selectedId, setSelectedId] = useState(null);
  const [profileTab, setProfileTab] = useState("Overview");
  const [tourOpen, setTourOpen] = useState(true);
  const [tourIndex, setTourIndex] = useState(0);
  const [location, setLocation] = useState("Downtown");
  const [layout, setLayout] = useState("cards");
  const [customerSearch, setCustomerSearch] = useState("");
  const [resourceType, setResourceType] = useState("All");
  const [inboxPerson, setInboxPerson] = useState("jordan");
  const [compose, setCompose] = useState("");
  const [demoMessages, setDemoMessages] = useState([]);
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState(null);
  const theme = brandStyle(defaultBrandColors, appearance);
  const step = tourSteps[tourIndex];
  const focus = (id) => tourOpen && step.target === id;
  const selected = people.find((person) => person.id === selectedId) || people[0];
  const visiblePeople = people.filter((person) => `${person.name} ${person.email} ${person.assigned}`.toLowerCase().includes(customerSearch.trim().toLowerCase()));
  const filteredResources = resourceSamples.filter((resource) => resourceType === "All" || resource.type === resourceType);
  const goToStep = (index) => {
    const next = tourSteps[index];
    setTourIndex(index);
    setView(next.view);
    setSelectedId(next.customer ? "jordan" : null);
    setProfileTab(next.tab || "Overview");
  };

  useEffect(() => {
    if (!allowed) window.location.replace("/retailers?signin=1");
  }, [allowed]);
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("ocean-light", "ocean-dark");
    html.classList.add(appearance === "light" ? "ocean-light" : "ocean-dark");
    return () => html.classList.remove("ocean-light", "ocean-dark");
  }, [appearance]);
  useEffect(() => {
    if (!tourOpen) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(step.target)?.scrollIntoView({
        block: step.target === "demo-brand" ? "start" : window.innerWidth <= 600 ? "end" : "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
      nextRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [tourOpen, tourIndex, view, profileTab, step.target]);
  useEffect(() => {
    if (!tourOpen) return;
    const handle = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setTourOpen(false); }
      if (event.key === "ArrowLeft" && tourIndex > 0) { event.preventDefault(); goToStep(tourIndex - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); if (tourIndex === tourSteps.length - 1) setTourOpen(false); else goToStep(tourIndex + 1); }
      if (event.key === "Tab") {
        const controls = [...document.querySelectorAll(".retail-demo-tour button:not(:disabled)")];
        if (!controls.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [tourOpen, tourIndex]);

  const navigate = (name) => {
    setView(name);
    setSelectedId(null);
    rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openPerson = (id, tab = "Overview") => {
    setView("Customers"); setSelectedId(id); setProfileTab(tab);
    rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const replay = () => { goToStep(0); setTourOpen(true); };
  const exit = () => {
    endRetailDemoSession(window.sessionStorage);
    window.location.replace("/retailers?signin=1");
  };
  const sendDemoMessage = (event) => {
    event.preventDefault();
    if (!compose.trim()) return;
    setDemoMessages((messages) => [...messages, compose.trim()]);
    setCompose("");
    setNotice("Sample message added in this browser only.");
  };
  if (!allowed) return <div className="retail-demo-redirect" role="status">Opening retailer sign in…</div>;

  const hero = (eyebrow, title, subtitle, action) => <header className="retail-header retail-page-header glass-panel accent-line retail-demo-hero">
    <div><span className="retail-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}
  </header>;
  const conversation = (person) => <div className="retail-demo-conversation">
    <div className="retail-demo-conversation-heading"><Avatar person={person} /><div><strong>{person.name}</strong><small>Store conversation · Sample thread</small></div></div>
    <div className="retail-demo-bubble incoming">Hi! Is the meal plan still a good fit on training days?</div>
    <div className="retail-demo-bubble outgoing">Yes. Use the higher-carb option we shared and check in after your next visit.</div>
    {demoMessages.map((message, index) => <div className="retail-demo-bubble outgoing" key={`${index}-${message}`}>{message}</div>)}
    <form className="retail-demo-compose" onSubmit={sendDemoMessage}><label className="sr-only" htmlFor="retail-demo-message">Demo message</label><input id="retail-demo-message" value={compose} onChange={(event) => setCompose(event.target.value)} placeholder="Try a sample message…" /><button type="submit">Add sample reply <ArrowRight size={16} /></button></form>
    <small>Messages in this demo stay in this browser tab and are never sent.</small>
  </div>;

  return <div ref={rootRef} className={`retail retail-workspace retail-${appearance} retail-demo`} data-retail-theme={appearance} style={theme}>
    <header className="retail-top">
      <div id="demo-brand" className={`retail-header-brand retail-demo-brand ${focus("demo-brand") ? "retail-demo-focus" : ""}`}>
        <img src={logo} alt="" className="retail-demo-mark" />
        <div><strong>MacroStack Retail</strong><small>Powered by <BrandWordmark /></small></div>
      </div>
      <div className="retail-demo-header-actions">
        <span className="retail-demo-mode-label"><Sparkles size={14} /> DEMO · SAMPLE DATA</span>
        <label className="retail-demo-location"><span className="sr-only">Sample store</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="Downtown">Downtown</option><option value="Northside">Northside</option></select></label>
        <button type="button" onClick={() => setAppearance((value) => value === "light" ? "dark" : "light")} aria-label={`Switch to ${appearance === "light" ? "dark" : "light"} mode`} className="retail-demo-icon-button">{appearance === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
        <DemoButton onClick={replay} icon={RotateCcw}>Replay tour</DemoButton>
        <DemoButton onClick={exit} icon={LogOut}>Exit demo</DemoButton>
      </div>
    </header>
    <nav className="retail-nav" aria-label="Demo store navigation">{mainSections.map(({ name, icon: Icon }) => <button key={name} type="button" aria-current={view === name ? "page" : undefined} onClick={() => navigate(name)}><Icon size={17} aria-hidden="true"/><span>{name}</span></button>)}</nav>
    <main className="retail-main">
      {view === "Today" && <>
        {hero(`MACROSTACK RETAIL · ${location.toUpperCase()}`, "Today", "A clear next step for every customer.", <DemoButton primary onClick={() => setDialog("Add customer")}>Add customer</DemoButton>)}
        <div id="demo-priorities" className={`retail-demo-priorities ${focus("demo-priorities") ? "retail-demo-focus" : ""}`}>
          {[{ value: "3", label: "Open conversations" }, { value: "4", label: "Follow-ups due" }, { value: "2", label: "Awaiting activation" }].map(({ value, label }) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <div className="retail-demo-two-col">
          <DemoPanel id="demo-followups" title="Follow-up queue" eyebrow="NEXT ACTIONS" focused={focus("demo-followups")}>
            <p className="retail-muted">Sorted by due date, with ownership visible to the team.</p>
            {[{ name: "Jordan Lee", task: "Review check-in and adjust plan", due: "Today", id: "jordan" }, { name: "Taylor Reed", task: "Discuss progress photos", due: "Tomorrow", id: "taylor" }, { name: "Alex Morgan", task: "Complete first consultation", due: "Upcoming", id: "alex" }].map((row) => <button type="button" className="retail-demo-list-row" key={row.name} onClick={() => openPerson(row.id)}><span><strong>{row.name}</strong><small>{row.task}</small></span><span className="retail-demo-due">{row.due}<ChevronRight size={16} /></span></button>)}
          </DemoPanel>
          <DemoPanel title="Continue a conversation" eyebrow="CUSTOMER SUPPORT"><p className="retail-muted">Answer questions before the next store visit.</p>{people.slice(0, 2).map((person) => <button key={person.id} className="retail-demo-list-row" type="button" onClick={() => { setInboxPerson(person.id); navigate("Inbox"); }}><Avatar person={person} /><span><strong>{person.name}</strong><small>Open store chat</small></span><ChevronRight size={16}/></button>)}</DemoPanel>
        </div>
      </>}

      {view === "Customers" && !selectedId && <>
        {hero("CUSTOMER RELATIONSHIPS", "Customers", "Every consultation, plan, progress update and conversation in one customer record.", <DemoButton primary onClick={() => setDialog("Add customer")}>Add customer</DemoButton>)}
        <section id="demo-directory" className={`retail-demo-directory ${focus("demo-directory") ? "retail-demo-focus" : ""}`}>
          <div className="retail-demo-directory-toolbar"><label><Search size={17} aria-hidden="true"/><span className="sr-only">Find a customer</span><input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Find a customer" /></label><div role="group" aria-label="Customer layout"><button type="button" aria-pressed={layout === "cards"} onClick={() => setLayout("cards")}>Cards</button><button type="button" aria-pressed={layout === "list"} onClick={() => setLayout("list")}>List</button></div></div>
          <p className="retail-demo-section-note">{visiblePeople.length} sample customers · Choose a customer to explore their workspace</p>
          <div className={layout === "cards" ? "retail-demo-customer-grid" : "retail-demo-customer-list"}>{visiblePeople.map((person) => <button type="button" className="retail-demo-customer" key={person.id} onClick={() => openPerson(person.id)}><span className="retail-demo-customer-main"><Avatar person={person}/><span><strong>{person.name}</strong><small>{person.email}</small></span></span><span className="retail-demo-customer-goal">{person.goal}</span><span className="retail-demo-customer-meta"><span>{person.status}</span><small>Assigned to {person.assigned} · {person.location}</small></span><ChevronRight size={18} aria-hidden="true" /></button>)}</div>
          {visiblePeople.length === 0 && <p>No sample customers match that search.</p>}
        </section>
      </>}

      {view === "Customers" && selectedId && <>
        <header className="retail-header retail-page-header glass-panel accent-line retail-demo-profile-header"><div className="retail-demo-profile-identity"><button type="button" className="retail-demo-back" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> Customers</button><Avatar person={selected} size="large" /><span><h1>{selected.name}</h1><p>{selected.status} · Assigned to {selected.assigned} · {selected.location}</p></span></div><DemoButton primary onClick={() => setDialog("Consultation")}>Start consultation</DemoButton></header>
        <nav className="retail-demo-profile-nav" aria-label="Customer sections">{profileSections.map((tab) => <button key={tab} type="button" aria-current={profileTab === tab ? "page" : undefined} onClick={() => setProfileTab(tab)}>{tab}</button>)}</nav>
        {profileTab === "Overview" && <div className="retail-demo-two-col"><div>
          <DemoPanel id="demo-consultation" title="Consultation & customer focus" eyebrow="ONE CONNECTED RECORD" focused={focus("demo-consultation")}><p>Goal: <strong>{selected.goal}</strong></p><div className="retail-demo-fact-grid"><div><span>Intake</span><strong>Completed</strong></div><div><span>Latest review</span><strong>Sep 22</strong></div><div><span>Next follow-up</span><strong>Sep 29</strong></div></div><div className="retail-demo-timeline"><div><Check size={16}/><span>Intake and preferences recorded</span></div><div><Check size={16}/><span>Nutrition guidance published</span></div><div><ClipboardCheck size={16}/><span>Review and follow-up scheduled</span></div></div></DemoPanel>
          <DemoPanel title="Current nutrition"><div className="retail-demo-macro-grid"><span><strong>2,170</strong><small>kcal / day</small></span><span><strong>160g</strong><small>protein</small></span><span><strong>225g</strong><small>carbs</small></span><span><strong>70g</strong><small>fat</small></span></div><DemoButton onClick={() => setProfileTab("Nutrition")}>View plan <ArrowRight size={15}/></DemoButton></DemoPanel>
        </div><DemoPanel title="Recent updates" eyebrow="CUSTOMER ACTIVITY"><div className="retail-demo-timeline"><div><Camera size={16}/><span>Progress photos shared · Sep 21</span></div><div><ClipboardCheck size={16}/><span>Check-in received · Sep 20</span></div><div><FileText size={16}/><span>Plan published · Sep 18</span></div></div></DemoPanel></div>}
        {profileTab === "Nutrition" && <div className="retail-demo-two-col"><div>
          <DemoPanel id="demo-targets" title="Daily macro targets" eyebrow="PERSONALIZED NUTRITION" focused={focus("demo-targets")}><p className="retail-muted">Calories update from the macro targets when a specialist sets them.</p><div className="retail-demo-macro-grid"><span><strong>2,170</strong><small>calories</small></span><span><strong>160g</strong><small>protein</small></span><span><strong>225g</strong><small>carbs</small></span><span><strong>70g</strong><small>fat</small></span></div><p className="retail-demo-status"><Check size={15}/> Plan shared with customer</p></DemoPanel>
          <DemoPanel id="demo-food-builder" title="Food database meal-plan builder" eyebrow="PLAN & PUBLISH" focused={focus("demo-food-builder")}><p className="retail-muted">Example breakfast in Jordan's three-day plan.</p><div className="retail-demo-food-search"><Search size={16}/><span>Search foods and set portions</span></div>{foodSamples.map((food) => <div className="retail-demo-food-row" key={food.name}><span><strong>{food.name}</strong><small>{food.amount}</small></span><span>{food.calories} kcal · {food.protein}g protein</span></div>)}<div className="retail-demo-panel-footer"><span>Save a plan template, publish to a customer, or export a branded PDF.</span><DemoButton onClick={() => setDialog("Plan preview")} icon={FileText}>Preview plan</DemoButton></div></DemoPanel>
        </div><DemoPanel title="Published plan" eyebrow="CUSTOMER VIEW"><h3>Balanced three-day starter</h3><p>Breakfast, lunch, dinner and snacks with portions and nutrition totals.</p><div className="retail-demo-plan-day"><strong>Day 1</strong><span>Breakfast · Greek yogurt bowl</span><span>Lunch · Chicken rice plate</span><span>Dinner · Salmon and potatoes</span></div><DemoButton onClick={() => setDialog("Plan preview")} icon={Download}>See branded PDF preview</DemoButton></DemoPanel></div>}
        {profileTab === "Food journal" && <DemoPanel id="demo-food-journal" title="Food journal" eyebrow="DAILY RECORDS" focused={focus("demo-food-journal")}><p className="retail-muted">Open a day to review meals and totals.</p>{[{ day: "Tuesday, September 22", total: "2,090 kcal · 154g protein", meals: ["Breakfast · Eggs and oats", "Lunch · Turkey wrap", "Dinner · Rice, vegetables and chicken"] }, { day: "Monday, September 21", total: "2,220 kcal · 167g protein", meals: ["Breakfast · Greek yogurt and fruit", "Lunch · Chicken rice plate", "Dinner · Salmon and potatoes"] }, { day: "Sunday, September 20", total: "1,980 kcal · 148g protein", meals: ["Breakfast · Protein smoothie", "Lunch · Sandwich and fruit", "Dinner · Steak and vegetables"] }].map((entry, index) => <details className="retail-demo-day" key={entry.day} open={index === 0}><summary><span><strong>{entry.day}</strong><small>{entry.total}</small></span><ChevronRight size={18}/></summary><div>{entry.meals.map((meal) => <p key={meal}>{meal}</p>)}</div></details>)}</DemoPanel>}
        {profileTab === "Progress" && <div className="retail-demo-two-col"><DemoPanel id="demo-progress" title="Progress & measurements" eyebrow="BETWEEN-VISIT EVIDENCE" focused={focus("demo-progress")}><div className="retail-demo-fact-grid"><div><span>Latest weight</span><strong>178 lb</strong></div><div><span>Measurements</span><strong>3 records</strong></div><div><span>Progress photos</span><strong>2 sets</strong></div></div><div className="retail-demo-progress-chart" aria-label="Example weight trend"><i style={{height:"52%"}}/><i style={{height:"62%"}}/><i style={{height:"55%"}}/><i style={{height:"74%"}}/><i style={{height:"66%"}}/><i style={{height:"82%"}}/></div><div className="retail-demo-panel-footer"><span>Photos are private to the customer and connected store.</span><DemoButton onClick={() => setDialog("Request photos")} icon={Camera}>Request photos</DemoButton></div></DemoPanel><DemoPanel title="Assessment history" eyebrow="MANUAL ENTRY"><p>Record in-store measurements and compare them with customer updates.</p><div className="retail-demo-list-row"><span><strong>Sep 21</strong><small>Weight and waist measurement</small></span><span>Reviewed</span></div><div className="retail-demo-list-row"><span><strong>Aug 29</strong><small>Baseline assessment</small></span><span>Recorded</span></div></DemoPanel></div>}
        {profileTab === "Check-ins" && <DemoPanel id="demo-checkins" title="Customer check-ins" eyebrow="REVIEW & RESPOND" focused={focus("demo-checkins")}><p className="retail-muted">Customer submissions stay connected to the same profile.</p>{[{ date: "Sep 20", summary: "Energy improving; schedule is still challenging.", status: "Needs review" }, { date: "Sep 13", summary: "Completed three training sessions and followed the plan.", status: "Reviewed" }].map((entry) => <div className="retail-demo-checkin" key={entry.date}><span><strong>{entry.date}</strong><small>{entry.summary}</small></span><span className="retail-demo-pill">{entry.status}</span></div>)}<p>Use the review to set a clear next action for the assigned specialist.</p></DemoPanel>}
        {profileTab === "Resources" && <DemoPanel id="demo-shared-resources" title="Shared files & resources" eyebrow="CUSTOMER MATERIALS" focused={focus("demo-shared-resources")}><p className="retail-muted">These sample items appear in the customer's connected MacroStack account.</p>{resourceSamples.filter((item) => item.type !== "Staff playbook").map((item) => <div className="retail-demo-list-row" key={item.name}><FileText size={20}/><span><strong>{item.name}</strong><small>{item.type}</small></span><DemoButton onClick={() => setDialog(item.name)}>Preview</DemoButton></div>)}<DemoButton onClick={() => navigate("Resources")} icon={BookOpen}>Open company library</DemoButton></DemoPanel>}
        {profileTab === "Chat" && <DemoPanel id="demo-customer-chat" title={`Chat with ${selected.name}`} eyebrow="STORE CONVERSATION" focused={focus("demo-customer-chat")}>{conversation(selected)}</DemoPanel>}
        {profileTab === "Private notes" && <DemoPanel title="Private staff notes" eyebrow="STAFF ONLY"><p>Sep 22 · Maya Chen</p><p>Jordan prefers simple weekday breakfasts and a Sunday meal-prep check-in. Keep follow-up specific and actionable.</p><p className="retail-muted">These notes are never shown to the customer.</p></DemoPanel>}
        {profileTab === "Measurements" && <DemoPanel title="Measurements" eyebrow="ASSESSMENT HISTORY"><div className="retail-demo-fact-grid"><div><span>Sep 21</span><strong>178 lb</strong></div><div><span>Aug 29</span><strong>181 lb</strong></div><div><span>Source</span><strong>In-store entry</strong></div></div><p>Compare manually entered assessments over time in the customer record.</p></DemoPanel>}
      </>}

      {view === "Inbox" && <>{hero("CUSTOMER CONVERSATIONS", "Inbox", "Store communication and customer context, together.")}<div id="demo-inbox" className={`retail-demo-inbox ${focus("demo-inbox") ? "retail-demo-focus" : ""}`}><aside aria-label="Sample conversations">{people.slice(0, 2).map((person) => <button key={person.id} type="button" aria-current={inboxPerson === person.id ? "true" : undefined} onClick={() => setInboxPerson(person.id)}><Avatar person={person}/><span><strong>{person.name}</strong><small>{person.goal}</small></span></button>)}</aside>{conversation(people.find((person) => person.id === inboxPerson) || people[0])}</div></>}

      {view === "Resources" && <>{hero("COMPANY KNOWLEDGE", "Resources", "Approved materials your team can reuse and personalize.", <DemoButton primary onClick={() => setDialog("Create resource")}>Create resource</DemoButton>)}<section id="demo-library" className={`retail-demo-library ${focus("demo-library") ? "retail-demo-focus" : ""}`}><div className="retail-demo-library-tabs" role="group" aria-label="Resource type">{["All", "Meal plan", "Intake form", "Guide", "Staff playbook"].map((type) => <button key={type} type="button" aria-pressed={resourceType === type} onClick={() => setResourceType(type)}>{type}</button>)}</div><div className="retail-demo-resource-grid">{filteredResources.map((resource) => <article key={resource.name}><span className="retail-demo-resource-icon"><FileText size={22}/></span><span className="retail-demo-eyebrow">{resource.type}</span><h2>{resource.name}</h2><p>{resource.detail}</p><DemoButton onClick={() => setDialog(resource.name)}>Preview <ArrowRight size={15}/></DemoButton></article>)}</div></section></>}

      {view === "Store" && <>{hero("COMPANY OPERATIONS", "Store", "Your identity, people and results across every location.")}<StoreSectionNav items={storeSections}/><div className="retail-store-settings-body retail-demo-settings">
        <section id="demo-branding" className={`retail-section retail-store-scroll-target ${focus("demo-branding") ? "retail-demo-focus" : ""}`}><h2 className="retail-store-section-heading">Branding</h2><p>Company administrators manage one identity across every store.</p><div className="retail-demo-brand-preview"><img src={logo} alt=""/><div><strong>MacroStack Retail</strong><small>Powered by <BrandWordmark/></small></div><div className="retail-demo-swatches"><span/><span/><span/></div></div><p className="retail-muted">Logo, display name, light and dark appearance, and brand colors carry through the portal and plan PDFs.</p></section>
        <section id="demo-team" className={`retail-section retail-store-scroll-target ${focus("demo-team") ? "retail-demo-focus" : ""}`}><h2 className="retail-store-section-heading">Team & permissions</h2><p>Give staff access that matches their job and location.</p><div className="retail-demo-table"><div className="retail-demo-table-head"><span>Employee</span><span>Role</span><span>Location</span></div>{[{name:"Avery Brooks",role:"Organization admin",store:"All locations"},{name:"Maya Chen",role:"Manager",store:"Downtown"},{name:"Sam Rivera",role:"Specialist",store:"Northside"}].map((row) => <div key={row.name}><strong>{row.name}</strong><span>{row.role}</span><span>{row.store}</span></div>)}</div><DemoButton onClick={() => setDialog("Invite employee")} icon={Users}>Preview employee invite</DemoButton></section>
        <section id="demo-org" className={`retail-section retail-store-scroll-target ${focus("demo-org") ? "retail-demo-focus" : ""}`}><h2 className="retail-store-section-heading">Locations & reporting</h2><p>Compare activity across your organization without losing each store's context.</p><div className="retail-demo-location-grid">{[{name:"Downtown",customers:"42",followups:"8",activation:"91%"},{name:"Northside",customers:"35",followups:"6",activation:"86%"}].map((row) => <div key={row.name}><span className="retail-demo-eyebrow">SAMPLE LOCATION</span><h3>{row.name}</h3><div><span><strong>{row.customers}</strong><small>customers</small></span><span><strong>{row.followups}</strong><small>follow-ups</small></span><span><strong>{row.activation}</strong><small>activation</small></span></div></div>)}</div><p className="retail-muted">Store reports also show consultation activity, assessments and follow-up completion.</p></section>
        <section id="demo-billing" className={`retail-section retail-store-scroll-target ${focus("demo-billing") ? "retail-demo-focus" : ""}`}><h2 className="retail-store-section-heading">Subscription</h2><div className="retail-demo-billing"><div><span className="retail-demo-eyebrow">STORE SUBSCRIPTION</span><strong>$599 <small>/ store / month</small></strong><p>Billed by MacroStack, LLC. This demo does not start checkout or collect payment details.</p></div><div><span>Billing contact</span><strong>operations@example.com</strong><span>Sample status</span><strong>Active</strong></div></div></section>
      </div></>}
    </main>
    {notice && <div className="retail-demo-toast" role="status">{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={14}/></button></div>}
    {dialog && <div className="retail-demo-modal-backdrop" onClick={() => setDialog(null)}><div className="retail-demo-modal" role="dialog" aria-modal="true" aria-labelledby="retail-demo-modal-title" onClick={(event) => event.stopPropagation()}><button className="retail-demo-modal-close" type="button" aria-label="Close preview" onClick={() => setDialog(null)}><X size={18}/></button><span className="retail-demo-eyebrow">SAMPLE PREVIEW</span><h2 id="retail-demo-modal-title">{dialog}</h2><p>{dialog === "Request photos" ? "In a live workspace, this asks the connected customer to share a new progress photo set." : dialog === "Invite employee" ? "Management sends a role-scoped invitation to a real employee from the live workspace." : dialog === "Add customer" ? "A live store can invite a new customer or connect an existing MacroStack account after the customer confirms the link." : dialog === "Plan preview" ? "A published plan includes meals, portions and nutrition totals in the store's branding, with Powered by MacroStack." : "This is a sample preview. In a live workspace, your team can create, edit and share this item."}</p><div className="retail-demo-modal-note"><ShieldCheck size={18}/><span>This demo does not change accounts, send invitations or charge a store.</span></div><DemoButton primary onClick={() => setDialog(null)}>Continue exploring</DemoButton></div></div>}
    {tourOpen && <TourDialog step={step} index={tourIndex} nextRef={nextRef} onBack={() => tourIndex > 0 && goToStep(tourIndex - 1)} onNext={() => tourIndex === tourSteps.length - 1 ? setTourOpen(false) : goToStep(tourIndex + 1)} onClose={() => setTourOpen(false)} />}
  </div>;
}
