import RequiredResources from './RequiredResources';
import CustomerDirectory from './CustomerDirectory';
import {PermissionContext} from './PermissionContext';
import {effectivePermissions} from './teamApi';
import Team from './Team';
import Resources from './Resources';
import {RetailThemeContext} from "./ThemeContext";
import { brandStyle } from "./brandColors";
import { LayoutDashboard, Users, MessageCircle, BookOpen, Settings2, MapPin, LogOut, ArrowUpRight } from "lucide-react";
import LoadingSplash from "../components/LoadingSplash";
import { accountEmail } from "./accountEmail";
import { supabase } from "../lib/supabase";
import { createRequestCache } from "./requestCache.mjs";
import OperationalHealth from "./OperationalHealth";
import Operations from "./Operations";
import StoreSectionNav from "./StoreSectionNav";
import useViewport from "./useViewport";
import useClock from "./useClock";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useStore from "../store";
import {
  command,
  context,
  list,
  reports,
  joinInfo,
  directory,
  inbox,
  queue,
  relationships,
  queueCounts,
} from "./api";
import { sections, displayDate, csvDownload } from "./model";
import {
  Button,
  Field,
  Select,
  Check,
  Empty,
  Alert,
  Modal,
  useAction,
} from "./ui";
import CustomerWorkspace from "./CustomerWorkspace";
import StoreBrand from "./StoreBrand";
import Branding from "./Branding";
import JoinQR from "./JoinQR";
import "./retail.css";
import "./retail-workspace.css";
const emptyContext = {
  locations: [],
  organizations: [],
  staff: [],
  operators: [],
};
export default function RetailApp({ retailerSession = false }) {
  useViewport();
  useEffect(() => {
    document.documentElement.classList.remove('ocean-dark', 'ocean-light');
    document.documentElement.classList.add('ocean-dark');
  }, []);
  const now = useClock();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  const user = useStore((s) => s.currentUser),
    back = useStore((s) => s.setActivePage);
  const [ctx, setCtx] = useState(emptyContext),
    [locationId, setLocationId] = useState(""),
    [requestedSection, setSection] = useState(
      new URLSearchParams(window.location.search).has("setup") ||
        new URLSearchParams(window.location.search).has("billing")
        ? "Store"
        : "Today",
    ),
    [customers, setCustomers] = useState([]),
    [templates, setTemplates] = useState([]),
    [tasks, setTasks] = useState([]),
    [threads, setThreads] = useState([]),
    [selected, setSelected] = useState(null),
    [customerTab, setCustomerTab] = useState(new URLSearchParams(window.location.search).has("chat") ? "Messages" : "Overview"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [loading, setLoading] = useState(true),
    [modal, setModal] = useState(null),
    [link, setLink] = useState(""),
    [metric, setMetric] = useState(null),
    [staffDirectory, setStaffDirectory] = useState([]),
    [offset, setOffset] = useState(0),
    [total, setTotal] = useState(0),
    [counts, setCounts] = useState({}),
    [network, setNetwork] = useState(null);
  const { busy, error, run, setError } = useAction();
  const generation = useRef(0);
  const [auxCache] = useState(() => createRequestCache());
  const [taskOffset, setTaskOffset] = useState(0),
    [threadOffset, setThreadOffset] = useState(0);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const params = new URLSearchParams(window.location.search);
  const initialCode = params.get("store") || params.get("invite") || "";
  const [code, setCode] = useState(initialCode),
    [info, setInfo] = useState(null),
    [consent, setConsent] = useState(false),
    [share, setShare] = useState(false);
  const [access,setAccess]=useState(null);
  useEffect(()=>{if(!locationId)return;let active=true;
    const load=()=>effectivePermissions(locationId).then(p=>{if(active)setAccess({locationId,...p})}).catch(()=>{if(active)setAccess({locationId})});
    load();const timer=setInterval(load,30000);window.addEventListener('focus',load);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',load)};
  },[locationId,ctx.staff]);
  const permissions=access?.locationId===locationId?access:{};
  const location = ctx.locations.find((l) => l.id === locationId),
    org = ctx.organizations.find((o) => o.id === location?.organization_id);
  const memberships = ctx.staff.filter(
    (s) => s.active && s.user_id === user?.id,
  );
  const isStaff = useMemo(
    () =>
      user?.role === "superadmin" ||
      ctx.staff.some(
        (m) =>
          m.active &&
          m.user_id === user?.id &&
          (m.location_id === locationId ||
            (m.organization_id === location?.organization_id &&
              (m.role === "organization_admin" ||
                (m.role === "operator" &&
                  m.operator_id === location?.operator_id)))),
      ),
    [ctx.staff, user?.role, user?.id, locationId, location],
  );
  const isOrgAdmin =
    user?.role === "superadmin" ||
    memberships.some(
      (s) =>
        s.organization_id === location?.organization_id &&
        s.role === "organization_admin",
    );
  const manager =
    isOrgAdmin ||
    memberships.some(
      (s) =>
        (s.location_id === locationId && s.role === "manager") ||
        (s.role === "operator" && s.operator_id === location?.operator_id),
    );
  const allowedSections = sections.filter((name) => {
    if (name === "Today" || name === "Customers") return permissions.customers;
    if (name === "Inbox") return permissions.chat;
    if (name === "Resources") return permissions.resources || permissions.resource_manage;
    if (name === "Store") return permissions.team || permissions.billing || permissions.branding || permissions.reports;
    return false;
  });
  const section = useMemo(() => isStaff && allowedSections.length && !allowedSections.includes(requestedSection)
    ? allowedSections[0] : requestedSection,
    // Access is fetched as one immutable snapshot; its capability flags are the dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStaff, requestedSection, permissions.customers, permissions.chat, permissions.resources, permissions.resource_manage, permissions.team, permissions.billing, permissions.branding, permissions.reports]);
  const storeSections = [
    ...(isOrgAdmin && permissions.branding && org ? [{ id: "retail-branding", label: "Branding" }] : []),
    ...(permissions.customer_write ? [{ id: "retail-onboarding", label: "Customer access" }] : []),
    ...(permissions.team ? [{ id: "retail-team", label: "Team & permissions" }] : []),
    ...(permissions.billing && permissions.team ? [{ id: "retail-launch", label: "Launch checklist" }, { id: "retail-health", label: "Operations health" }] : []),
    ...(permissions.billing && org ? [{ id: "retail-billing", label: "Subscription" }] : []),
    ...(permissions.reports ? [{ id: "retail-reports", label: "Store performance" }] : []),
    ...(isOrgAdmin && (permissions.reports || permissions.team) ? [{ id: "retail-organization", label: "Organization" }] : []),
  ];
  const employees = staffDirectory;
  const reloadContext = useCallback(async () => {
    const c = await context(user?.id);
    setCtx(c);
    setLocationId((id) =>
      c.locations.some((l) => l.id === id) ? id : c.locations[0]?.id || "",
    );
    setLoading(false);
  }, [user?.id]);
  useEffect(() => {
    let active = true;
    context(user?.id)
      .then((c) => {
        if (active) {
          setCtx(c);
          setLocationId(c.locations[0]?.id || "");
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [setError, user?.id]);
  const refresh = useCallback(
    async (force = true) => {
      const g = ++generation.current;
      if (!locationId) return;
      const inboxState = section === "Today" ? "open" : "all";
      const [c, auxiliary] = await Promise.all([
        section === "Customers" || !isStaff
          ? relationships(locationId, {
              search: section === "Customers" ? search : "",
              filter: section === "Customers" ? filter : "all",
              userId: user?.id,
              offset: section === "Customers" ? offset : 0,
            })
          : Promise.resolve({ rows: [], count: 0 }),
        auxCache.get(
          `${user?.id}:${locationId}:${isStaff}:${taskOffset}:${threadOffset}:${inboxState}`,
          () =>
            Promise.all([
              list("templates", { organization_id: location?.organization_id }),
              isStaff && permissions.customers ? queue(locationId, taskOffset) : Promise.resolve([]),
              isStaff && permissions.chat
                ? inbox(locationId, { offset: threadOffset, state: inboxState })
                : Promise.resolve([]),
              isStaff && permissions.customers ? directory(locationId) : Promise.resolve([]),
              isStaff && permissions.customers ? queueCounts(locationId) : Promise.resolve({}),
            ]),
          force,
        ),
      ]);
      const [t, ts, th, people, counts] = auxiliary;
      if (g !== generation.current) return;
      setCustomers(c.rows);
      setTotal(c.count);
      setTemplates(
        t.filter((x) => !x.location_id || x.location_id === locationId),
      );
      setTasks(ts);
      setThreads(th);
      setStaffDirectory(people);
      setCounts(counts);
    },
    [
      locationId,
      location,
      search,
      filter,
      offset,
      section,
      user?.id,
      isStaff,
      permissions.customers,
      permissions.chat,
      auxCache,
      taskOffset,
      threadOffset,
    ],
  );
  useEffect(() => {
    refresh(false).catch((e) => setError(e.message));
    return () => {
      // Request counter, not a DOM node; invalidate in-flight responses.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
    };
  }, [refresh, setError]);
  useEffect(() => {
    if (!code) return;
    let active = true;
    joinInfo(code)
      .then((i) => {
        if (active) setInfo(i);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [code, setError]);
  useEffect(() => {
    if (!isStaff || selected) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        refresh().catch((e) => setError(e.message));
    }, 30000);
    return () => clearInterval(timer);
  }, [isStaff, selected, refresh, setError]);
  const openCustomer = (id, tab = "Overview") =>
    run(async () => {
      const c =
        customers.find((c) => c.id === id) ||
        (await list("relationships", { id }))[0];
      if (c) {
        setCustomerTab(tab);
        setSelected(c);
      }
    });
  const openTasks = tasks
    .filter((t) => t.status === "open")
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
  const filtered = customers.filter(
    (c) =>
      `${c.name} ${c.email} ${c.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "mine" && c.assigned_to === user.id) ||
        filter === c.status),
  );
  const showReports = () =>
    run(async () => {
      setMetric(await reports(locationId));
      setSection("Store");
    });
  const closeModal = useCallback(() => setModal(null), []);
  const [emailInvite, setEmailInvite] = useState(null);
  const newLink = async (invite) => {
    const url = new URL(invite.role === "customer" ? "/retail/member" : "/retail", window.location.origin);
    url.searchParams.set("invite", invite.token);
    if (invite.role !== "customer") url.searchParams.set("staff", "1");
    setLink(url.toString());
    setModal(null);
    setEmailInvite({id:invite.id,sent:false});
    await accountEmail("invite",{invitation_id:invite.id});
    setEmailInvite({id:invite.id,sent:true});
  };
  const switchLocation = (id) => {
    if (
      !window.dispatchEvent(
        new Event("retail-before-leave", { cancelable: true }),
      )
    )
      return;
    setSelected(null);
    setMetric(null);
    setNetwork(null);
    setOffset(0);
    setLocationId(id);
    setTaskOffset(0);
    setThreadOffset(0);
    setCustomers([]);
    setTasks([]);
    setThreads([]);
  };
  return (
    <PermissionContext.Provider value={permissions}><RetailThemeContext.Provider value={brandStyle(org?.brand_colors)}><div className="retail retail-workspace" style={brandStyle(org?.brand_colors)}>
      <header className="retail-top">
        <div className="retail-header-brand">
          <div className="retail-brand">
            <StoreBrand locationId={locationId} organization={org} revision={ctx} />
          </div>

        </div>
        <div className="retail-actions retail-header-controls">
          {ctx.locations.length > 0 && (
            <label className="retail-location-control"><span><MapPin size={12} aria-hidden="true"/>{isStaff ? "STORE WORKSPACE" : "YOUR STORE CONNECTION"}</span><select
              aria-label="Choose store"
              value={locationId}
              onChange={(e) => switchLocation(e.target.value)}
            >
              {ctx.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select></label>
          )}
          <Button
            onClick={() => {
              if (
                !window.dispatchEvent(
                  new Event("retail-before-leave", { cancelable: true }),
                )
              )
                return;
              if (retailerSession) { run(async () => { const {error:e}=await supabase.auth.signOut({scope:"local"}); if(e) throw e; }); return; }
              window.history.replaceState({}, "", "/dashboard");
              back("dashboard");
            }}
          >
            {retailerSession ? <LogOut size={15} aria-hidden="true"/> : <ArrowUpRight size={15} aria-hidden="true"/>}{retailerSession ? "Sign out" : "Back to app"}
          </Button>
        </div>
      </header>
      {isStaff && (
        <nav className="retail-nav" aria-label="Store navigation">
          {allowedSections.map((s) => (
            <button
              key={s}
              aria-current={
                s === (selected ? "Customers" : section) ? "page" : undefined
              }
              onClick={() => {
                if (
                  !window.dispatchEvent(
                    new Event("retail-before-leave", { cancelable: true }),
                  )
                )
                  return;
                setSelected(null);
                setSection(s);
                setTaskOffset(0);
                setThreadOffset(0);
                if (s === "Store" && permissions.reports) showReports();
              }}
            >
              {(() => { const Icon = { Today: LayoutDashboard, Customers: Users, Inbox: MessageCircle, Resources: BookOpen, Store: Settings2 }[s]; return Icon ? <Icon size={17} aria-hidden="true"/> : null; })()}<span>{s}</span>
            </button>
          ))}
        </nav>
      )}
      <main className="retail-main">
        {isStaff &&
          location?.billing_required &&
          (!location.enabled ||
            !location.sponsorship_ends_at ||
            Date.parse(location.sponsorship_ends_at) <= now) && (
            <section className="retail-card retail-banner">
              <h2>Your workspace is ready. Activate your store next.</h2>
              <p>
                Invite your team and prepare resources now. Activate the
                $599/month store subscription to start customer consultations,
                plans, messages, check-ins and sponsored Pro access.
              </p>
              <Button primary onClick={() => setSection("Store")}>
                Open store setup & billing
              </Button>
              <Button onClick={() => run(reloadContext)}>
                Refresh activation status
              </Button>
            </section>
          )}
        <Alert
          error={
            !online
              ? "You are offline. Keep this page open; unsaved edits remain here. Reconnect and save before leaving."
              : error
          }
        />
        {link && (
          <div className="retail-card retail-banner">
            <h2>{emailInvite?.sent ? "Invitation email sent" : "Invitation ready"}</h2>
            {emailInvite && <Button disabled={busy} onClick={()=>run(async()=>{await accountEmail("invite",{invitation_id:emailInvite.id});setEmailInvite({...emailInvite,sent:true});})}>{emailInvite.sent ? "Resend invitation email" : "Send invitation email"}</Button>}
            <p>
              Share this single-use link with the intended recipient. It expires
              in seven days and requires their invited email.
            </p>
            <Field
              label="Invitation link"
              value={link}
              readOnly
              onChange={() => {}}
            />
            <Button
              onClick={() =>
                run(async () => {
                  await navigator.clipboard.writeText(link);
                })
              }
            >
              Copy link
            </Button>
            <Button onClick={() => setLink("")}>Dismiss</Button>
          </div>
        )}
        {code && (
          <section className="retail-card retail-banner">
            <h2>{info ? `Connect with ${info.name}` : "Store invitation"}</h2>
            <p>
              {info?.organization ||
                "Sign in with the invited email to accept a staff invitation."}
            </p>
            <p>{info?.response_expectation}</p>
            <Check checked={consent} onChange={setConsent}>
              I agree to connect my account. The authorized store team can
              access the information I share through consultations, store plans,
              check-ins and messages. Existing personal records are not
              automatically transferred.
            </Check>
            <Check checked={share} onChange={setShare}>
              Also share my nutrition and weight activity with authorized store
              staff.
            </Check>
            <Button
              primary
              disabled={busy || !consent}
              onClick={() =>
                run(async () => {
                  await command(
                    params.get("invite") ? "accept_invite" : "join",
                    { token: code, code, consent, share_activity: share },
                  );
                  await useStore.getState().refreshRetailSponsorship();
                  setCode("");
                  window.history.replaceState({}, "", retailerSession ? "/retail" : "/retail/member");
                  sessionStorage.removeItem("ms-retail-return");
                  await reloadContext();
                  await refresh();
                })
              }
            >
              Confirm connection
            </Button>
          </section>
        )}
        {loading ? (
          <LoadingSplash label="Loading your stores…" />
        ) : isStaff && access?.locationId !== locationId ? (
          <LoadingSplash label="Loading store access…" />
        ) : selected ? (
          <CustomerWorkspace
            key={`${selected.id}:${customerTab}`}
            initialTab={customerTab}
            relationship={
              customers.find((c) => c.id === selected.id) || selected
            }
            staff={
              user?.role === "superadmin" ||
              memberships.some((m) => m.location_id === selected.location_id)
            }
            manager={manager}
            employees={employees}
            templates={templates}
            onBack={() => {
              setSelected(null);
              setSection("Customers");
            }}
            onRefresh={async () => {
              await refresh();
              const rows = await list("relationships", { id: selected.id });
              setSelected(rows[0] || null);
              await useStore.getState().refreshRetailSponsorship();
            }}
          />
        ) : !locationId ? (
          <section className="retail-section">
            {!code && (
              <a className="retail-button primary" href="/retailers">
                Retailer? Create your business workspace →
              </a>
            )}
            <h1>
              {user?.role === "superadmin"
                ? "Set up a retail organization"
                : "No store connection yet"}
            </h1>
            <p className="retail-muted">
              {user?.role === "superadmin"
                ? "Create an organization and its first pilot store. Stores start with a 90-day sponsored pilot."
                : retailerSession ? "Create your business workspace or use the staff invitation sent to your work email." : "Use the customer invitation or QR link supplied by your store. Your personal MacroStack account stays intact."}
            </p>
            {user?.role === "superadmin" && (
              <Button primary onClick={() => setModal("provision")}>
                Create organization
              </Button>
            )}
            <Button onClick={() => run(reloadContext)}>Refresh access</Button>
          </section>
        ) : !isStaff ? (
          <>
            <header className="retail-header retail-page-header glass-panel accent-line anim-fade-in-down" key={section}>
              <div>
                <div className="retail-eyebrow">Your team</div>
                <h1>{location.name}</h1>
                <p className="retail-muted">{location.response_expectation}</p>
              </div>
            </header>
            {customers.map((c) => (
              <button
                className="retail-card retail-customer-card"
                key={c.id}
                onClick={() => setSelected(c)}
              >
                <span className="retail-badge">{c.status}</span>
                <h2 style={{ marginTop: 12 }}>Your plan & progress</h2>
                <p>
                  {c.goal || "Your store will help you choose your next step."}
                </p>
                <strong>Open your store workspace →</strong>
              </button>
            ))}
          </>
        ) : (
          <>
            <header className="retail-header retail-page-header glass-panel accent-line anim-fade-in-down" key={section}>
              <div>
                <div className="retail-eyebrow">
                  {org?.name} · {location.name}
                </div>
                <h1>{section}</h1>
                <p className="retail-muted">
                  {
                    {
                      Today: "A clear next step for every customer.",
                      Customers:
                        "Manage nutrition plans, food journals, progress and follow-ups for every customer.",
                      Inbox: "One team. Every conversation accounted for.",
                      Resources: "Create once. Personalize and share with your customers.",
                      Store: "Your team, operations and store results.",
                    }[section]
                  }
                </p>
              </div>
              {permissions.customer_write && ["Today", "Customers"].includes(section) && (
                <Button primary onClick={() => setModal("prospect")}>
                  Add customer
                </Button>
              )}
            </header>
            {section === "Today" && (
              <>
                <RequiredResources locationId={locationId} userId={user.id} roles={memberships.filter(s=>s.location_id===locationId || s.role==='organization_admin' || (s.role==='operator' && s.operator_id===location?.operator_id)).map(s=>s.access_role||s.role)}/>
                <div className="retail-stats">
                  {[
                    [counts.open || 0, "Open conversations"],
                    [counts.due || 0, "Follow-ups due"],
                    [counts.invited || 0, "Awaiting activation"],
                  ].map(([n, l]) => (
                    <div className="retail-card" key={l}>
                      <strong>{n}</strong>
                      <small>{l}</small>
                    </div>
                  ))}
                </div>
                <div className="retail-columns">
                  <section className="retail-section">
                    <h2>Follow-up queue</h2>
                    <p className="retail-muted">
                      25 actions per page, oldest due first.
                    </p>
                    {!openTasks.length && (
                      <Empty>
                        No open follow-ups. Start a consultation to set the next
                        step.
                      </Empty>
                    )}
                    {openTasks.slice(0, 25).map((t) => (
                      <div className="retail-row" key={t.id}>
                        <div>
                          <h3>
                            {t.name ||
                              t.retail_relationships?.name ||
                              customers.find((c) => c.id === t.relationship_id)
                                ?.name}
                          </h3>
                          <p>{t.title}</p>
                          <small className="retail-muted">
                            {displayDate(t.due_at, location.timezone)} ·{" "}
                            {Date.parse(t.due_at) <= now ? "Due" : "Upcoming"}
                          </small>
                        </div>
                        <Button onClick={() => openCustomer(t.relationship_id)}>
                          Open
                        </Button>
                      </div>
                    ))}
                    <div className="retail-actions">
                      <Button
                        disabled={taskOffset === 0 || busy}
                        onClick={() =>
                          setTaskOffset((n) => Math.max(0, n - 25))
                        }
                      >
                        Previous actions
                      </Button>
                      <span>Page {Math.floor(taskOffset / 25) + 1}</span>
                      <Button
                        disabled={tasks.length <= 25 || busy}
                        onClick={() => setTaskOffset((n) => n + 25)}
                      >
                        Next actions
                      </Button>
                    </div>
                  </section>
                  <aside className="retail-section">
                    <h2>Continue a conversation</h2>
                    {threads
                      .filter((t) => t.status === "open")
                      .slice(0, 10)
                      .map((t) => (
                        <div className="retail-row" key={t.relationship_id}>
                          <div>
                            <h3>
                              {t.name ||
                                t.retail_relationships?.name ||
                                customers.find(
                                  (c) => c.id === t.relationship_id,
                                )?.name}
                            </h3>
                            <p>
                              {t.assigned_to ? "Assigned" : "Needs assignment"}
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              openCustomer(t.relationship_id, "Messages")
                            }
                          >
                            Open
                          </Button>
                        </div>
                      ))}
                    {!threads.some((t) => t.status === "open") && (
                      <Empty>No open conversations.</Empty>
                    )}
                  </aside>
                </div>
              </>
            )}
            {section === "Customers" && (
              <>
                <div className="retail-fields">
                  <Field
                    label="Find a customer"
                    value={query}
                    onChange={(v) => {
                      setOffset(0);
                      setQuery(v);
                    }}
                    placeholder="Name, email or phone"
                  />
                  <Select
                    label="Show"
                    value={filter}
                    onChange={(v) => {
                      setOffset(0);
                      setFilter(v);
                    }}
                  >
                    {[
                      ["all", "All accessible"],
                      ["mine", "Assigned to me"],
                      ["invited", "Awaiting activation"],
                      ["active", "Active"],
                      ["paused", "Paused"],
                      ["ended", "Ended"],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
                <CustomerDirectory customers={filtered} employees={employees} user={user} onOpen={(customer,tab)=>{setCustomerTab(tab);setSelected(customer)}}/>
                {!filtered.length && (
                  <Empty>
                    <h2>
                      {query || filter !== "all"
                        ? "No matching customers"
                        : "Start with your first customer"}
                    </h2>
                    <p>
                      {query || filter !== "all"
                        ? "Try another name or clear the filters."
                        : "Add a customer, share their private invitation, then manage their nutrition plan and progress here."}
                    </p>
                    {!query && filter === "all" && permissions.customer_write && (
                      <Button primary onClick={() => setModal("prospect")}>
                        Add your first customer
                      </Button>
                    )}
                  </Empty>
                )}
                <div className="retail-actions" style={{ marginTop: 20 }}>
                  <Button
                    disabled={offset === 0}
                    onClick={() => setOffset((n) => Math.max(0, n - 50))}
                  >
                    Previous
                  </Button>
                  <span>
                    {total} customers · Page {Math.floor(offset / 50) + 1}
                  </span>
                  <Button
                    disabled={offset + 50 >= total}
                    onClick={() => setOffset((n) => n + 50)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
            {section === "Inbox" && (
              <section className="retail-section">
                {threads.length ? (
                  threads.slice(0, 50).map((t) => (
                    <div className="retail-row" key={t.relationship_id}>
                      <div>
                        <h3>
                          {t.name ||
                            t.retail_relationships?.name ||
                            customers.find((c) => c.id === t.relationship_id)
                              ?.name}
                        </h3>
                        <p>
                          {t.status} · {t.unread || 0} unread ·{" "}
                          {employees.find((e) => e.user_id === t.assigned_to)
                            ?.name || "Unassigned"}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          openCustomer(t.relationship_id, "Messages")
                        }
                      >
                        Open conversation
                      </Button>
                    </div>
                  ))
                ) : (
                  <Empty>No customer conversations on this page.</Empty>
                )}
                <div className="retail-actions">
                  <Button
                    disabled={threadOffset === 0 || busy}
                    onClick={() => setThreadOffset((n) => Math.max(0, n - 50))}
                  >
                    Previous conversations
                  </Button>
                  <span>Page {Math.floor(threadOffset / 50) + 1}</span>
                  <Button
                    disabled={threads.length <= 50 || busy}
                    onClick={() => setThreadOffset((n) => n + 50)}
                  >
                    Next conversations
                  </Button>
                </div>
              </section>
            )}
            {section === "Resources" && (
              <Resources locations={ctx.locations.filter(l=>l.organization_id===org?.id)} location={location} organizationId={org?.id} manager={!!permissions.resource_manage} corporate={isOrgAdmin && !!permissions.resource_manage} />
            )}
            {section === "Store" && (
              <>
                <StoreSectionNav items={storeSections} />
                <div className="retail-store-settings-body">
                {isOrgAdmin && permissions.branding && org && <Branding key={org.id} organization={org} onSaved={reloadContext} />}
                {permissions.customer_write && <section className="retail-section retail-store-scroll-target" id="retail-onboarding" tabIndex={-1}>
                  <h2 className="retail-store-section-heading">Customer access</h2>
                  <p>Customers sign in or create an account, then explicitly confirm this store connection.</p>
                  <JoinQR url={`${window.location.origin}/retail/member?store=${location.join_code}`} />
                  <Field
                    label="Customer link"
                    value={`${window.location.origin}/retail/member?store=${location.join_code}`}
                    readOnly
                    onChange={() => {}}
                  />
                  <Button
                    onClick={() => run(() => navigator.clipboard.writeText(`${window.location.origin}/retail/member?store=${location.join_code}`))}
                  >
                    Copy onboarding link
                  </Button>
                </section>}
                {permissions.team && <Team organizationId={org.id} location={location} locations={ctx.locations.filter(l=>l.organization_id===org.id)} operators={ctx.operators.filter(o=>o.organization_id===org.id)} corporate={isOrgAdmin} onChanged={async()=>{await reloadContext();await refresh();}}/>}
                {permissions.billing && permissions.team && (
                  <OperationalHealth
                    key={`health-${location.id}`}
                    location={location}
                    onNavigate={(target, anchor) => {
                      setSection(target);
                      requestAnimationFrame(() => {
                        const destination = anchor && document.getElementById(anchor);
                        if (destination) {
                          destination.focus({ preventScroll: true });
                          destination.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
                        } else {
                          window.scrollTo({ top: 0, behavior: "instant" });
                        }
                      });
                    }}
                  />
                )}
                {permissions.billing && org && (
                  <Operations
                    key={location.id}
                    onBillingRefresh={reloadContext}
                    location={location}
                    admin={user?.role === "superadmin"}
                    organizationAdmin={
                      user?.role === "superadmin" ||
                      memberships.some(
                        (m) =>
                          m.organization_id === org.id &&
                          m.role === "organization_admin",
                      )
                    }
                  />
                )}
                    {permissions.reports && (
                      <section className="retail-section retail-store-scroll-target" id="retail-reports" tabIndex={-1}>
                        <h2 className="retail-store-section-heading">Store performance</h2>
                        <p>Activity from the last 30 days.</p>
                        <Button onClick={showReports} disabled={busy}>
                          Refresh metrics
                        </Button>
                        {metric && (
                          <>
                            <div style={{ marginTop: 12 }}>
                              {[
                                ["customers", "New relationships"],
                                ["activated", "Activations"],
                                ["consultations", "Published consultations"],
                                ["scans", "Assessments recorded"],
                                ["repeat_scans", "Customers with repeat scans"],
                                ["tasks_due", "Follow-ups due in period"],
                                [
                                  "tasks_completed",
                                  "Those follow-ups completed",
                                ],
                                ["active_staff", "Active store staff"],
                              ].map(([k, l]) => (
                                <div className="retail-row" key={k}>
                                  <span>{l}</span>
                                  <strong>{metric[k]}</strong>
                                </div>
                              ))}
                            </div>
                            {permissions.exports && <Button
                              onClick={() =>
                                csvDownload(
                                  [
                                    ["Metric", "Value"],
                                    ...Object.entries(metric),
                                  ],
                                  "store-metrics.csv",
                                )
                              }
                            >
                              Export metrics
                            </Button>}
                            <p
                              className="retail-muted"
                              style={{ marginTop: 12 }}
                            >
                              Activation counts use activation dates; new
                              relationships use creation dates. These are
                              separate cohorts, not a conversion-rate
                              calculation.
                            </p>
                          </>
                        )}
                      </section>
                    )}
                    {isOrgAdmin && (permissions.reports || permissions.team) && (
                      <section className="retail-section retail-store-scroll-target" id="retail-organization" tabIndex={-1}>
                        <h2 className="retail-store-section-heading">Organization</h2>
                        <p>Manage locations and review results across the business.</p>
                        {permissions.reports && <Button
                          disabled={busy}
                          onClick={() =>
                            run(async () =>
                              setNetwork(
                                await Promise.all(
                                  ctx.locations
                                    .filter((l) => l.organization_id === org.id)
                                    .map(async (l) => ({
                                      store: l.name,
                                      ...(await reports(l.id)),
                                    })),
                                ),
                              ),
                            )
                          }
                        >
                          Compare stores
                        </Button>}
                        {network && (
                          <>
                            <div className="retail-table-wrap">
                              <table className="retail-table">
                                <thead>
                                  <tr>
                                    <th>Store</th>
                                    <th>Activations</th>
                                    <th>Consultations</th>
                                    <th>Repeat scans</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {network.map((n) => (
                                    <tr key={n.store}>
                                      <td>{n.store}</td>
                                      <td>{n.activated}</td>
                                      <td>{n.consultations}</td>
                                      <td>{n.repeat_scans}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {permissions.exports && <Button
                              onClick={() =>
                                csvDownload(
                                  [
                                    [
                                      "Store",
                                      "Activations",
                                      "Consultations",
                                      "Repeat scans",
                                    ],
                                    ...network.map((n) => [
                                      n.store,
                                      n.activated,
                                      n.consultations,
                                      n.repeat_scans,
                                    ]),
                                  ],
                                  "retail-network-metrics.csv",
                                )
                              }
                            >
                              Export store comparison
                            </Button>}
                          </>
                        )}
                        <div className="retail-actions">
                        {permissions.team && <Button onClick={() => setModal("operator")}>
                          Add operator
                        </Button>}
                        {permissions.team && <Button onClick={() => setModal("location")}>
                          Add store
                        </Button>}
                        {permissions.team && <Button onClick={() => setModal("settings")}>
                          Store settings
                        </Button>}
                        {user?.role === "superadmin" && (
                          <>
                            <Button onClick={() => setModal("provision")}>
                              New organization
                            </Button>
                            <Button onClick={() => setModal("sponsorship")}>
                              Sponsorship term
                            </Button>
                          </>
                        )}
                        </div>
                      </section>
                    )}
                </div>
              </>
            )}
          </>
        )}
      </main>
      {modal && (
        <Modal
          title={
            typeof modal === "object"
              ? modal.id
                ? "Edit resource"
                : "Review draft"
              : {
                  provision: "Create retail organization",
                  prospect: "New customer",
                  staff: "Invite employee",
                  template: "Create resource",
                  operator: "Add operator",
                  location: "Add store",
                  settings: "Store settings",
                  sponsorship: "Sponsorship term",
                }[modal]
          }
          onClose={closeModal}
        >
          <SetupForm
            kind={modal}
            location={location}
            organization={org}
            operators={ctx.operators}
            isOrgAdmin={isOrgAdmin}
            onSaved={async (result) => {
              if (result?.token) await newLink(result);
              else setModal(null);
              await reloadContext();
              await refresh();
            }}
          />
        </Modal>
      )}
    </div></RetailThemeContext.Provider></PermissionContext.Provider>
  );
}
function SetupForm({
  kind,
  location,
  organization,
  operators,
  isOrgAdmin,
  onSaved,
}) {
  const existing = typeof kind === "object" ? kind : null;
  const type = existing ? "template" : kind;
  const [requestId] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState({
    name: type === "settings" ? location.name : "",
    operator_name: "Corporate",
    location_name: "",
    kind: "corporate",
    timezone: location?.timezone || "America/Chicago",
    email: "",
    phone: "",
    goal: "",
    role: "specialist",
    operator_id: location?.operator_id || operators[0]?.id || "",
    category: existing?.category || "nutrition",
    title: existing?.title || "",
    body: existing?.content.body || "",
    questions: existing?.content.questions || [],
    published: existing?.published ?? false,
    corporate: existing ? !existing.location_id : false,
    enabled: location?.enabled ?? true,
    response_expectation: location?.response_expectation || "",
    ends_at: location?.sponsorship_ends_at?.slice(0, 10) || "",
  });
  const { busy, error, run } = useAction();
  const field = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      let payload = {
        request_id: requestId,
        ...form,
        location_id: location?.id,
        organization_id: organization?.id,
      };
      let action =
        { staff: "invite_staff", settings: "location" }[type] || type;
      if (type === "location") payload.location_id = null;
      if (type === "template")
        payload = {
          ...payload,
          id: existing?.id,
          version: existing?.version,
          location_id: form.corporate ? null : location?.id,
          content: { body: form.body, questions: form.questions },
        };
      const result = await command(action, payload);
      await onSaved(result);
    });
  };
  return (
    <form onSubmit={submit}>
      <Alert error={error} />
      {["provision", "prospect", "operator", "location", "settings"].includes(
        type,
      ) && (
        <Field
          label={
            type === "prospect"
              ? "Customer name"
              : type === "provision"
                ? "Organization name"
                : "Name"
          }
          value={form.name}
          onChange={field("name")}
          required
          maxLength={120}
        />
      )}
      {type === "provision" && (
        <>
          <Field
            label="Operator name"
            value={form.operator_name}
            onChange={field("operator_name")}
            required
          />
          <Field
            label="First store name"
            value={form.location_name}
            onChange={field("location_name")}
            required
          />
        </>
      )}
      {["operator", "provision"].includes(type) && (
        <Select
          label="Operator type"
          value={form.kind}
          onChange={field("kind")}
        >
          <option value="corporate">Corporate</option>
          <option value="franchise">Franchise</option>
        </Select>
      )}
      {["location", "staff"].includes(type) && (
        <Select
          label="Operator (for operator invitations / store ownership)"
          value={form.operator_id}
          onChange={field("operator_id")}
        >
          {operators
            .filter((o) => o.organization_id === organization?.id)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
        </Select>
      )}
      {["location", "settings", "provision"].includes(type) && (
        <Field
          label="Timezone (IANA)"
          value={form.timezone}
          onChange={field("timezone")}
          required
        />
      )}
      {type === "settings" && (
        <>
          <Field
            label="Response expectation"
            value={form.response_expectation}
            onChange={field("response_expectation")}
          />
          <Check checked={form.enabled} onChange={field("enabled")}>
            Store enabled
          </Check>
        </>
      )}
      {type === "sponsorship" && (
        <>
          <p>
            Changing this term affects sponsored Pro access only. It does not
            change customers’ own paid subscriptions.
          </p>
          <Field
            label="Access ends (UTC)"
            type="date"
            value={form.ends_at}
            onChange={field("ends_at")}
            required
          />
        </>
      )}
      {["prospect", "staff"].includes(type) && (
        <Field
          label="Invitation email"
          type="email"
          value={form.email}
          onChange={field("email")}
          required
        />
      )}
      {type === "prospect" && (
        <>
          <Field
            label="Phone (optional)"
            value={form.phone}
            onChange={field("phone")}
          />
          <Field
            label="Primary goal"
            value={form.goal}
            onChange={field("goal")}
          />
          <p className="retail-muted">
            An invitation link will be created for you to share. No email is
            sent automatically.
          </p>
        </>
      )}
      {type === "staff" && (
        <Select label="Role" value={form.role} onChange={field("role")}>
          <option value="specialist">Results Specialist</option>
          {isOrgAdmin && (
            <>
              <option value="manager">Store manager</option>
              <option value="operator">Franchise/operator administrator</option>
              <option value="organization_admin">
                Organization administrator (aggregate access)
              </option>
            </>
          )}
        </Select>
      )}
      {type === "template" && (
        <>
          <Field
            label="Resource title"
            value={form.title}
            onChange={field("title")}
            required
          />
          <Select
            label="Category"
            value={form.category}
            onChange={field("category")}
          >
            {["consultation", "nutrition", "product", "followup"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          {form.category === "consultation" && (
            <section className="retail-section">
              <h3>Intake questions</h3>
              {form.questions.map((q, i) => (
                <div key={q.id} className="retail-row">
                  <Field
                    label={`Question ${i + 1}`}
                    value={q.label}
                    onChange={(v) =>
                      field("questions")(
                        form.questions.map((x) =>
                          x.id === q.id ? { ...x, label: v } : x,
                        ),
                      )
                    }
                    required
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      field("questions")(
                        form.questions.filter((x) => x.id !== q.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                disabled={form.questions.length >= 20}
                onClick={() =>
                  field("questions")([
                    ...form.questions,
                    { id: crypto.randomUUID(), label: "" },
                  ])
                }
              >
                Add question
              </Button>
              <p className="retail-muted">
                Questions are optional for customers. Submitted forms retain the
                question labels used at that time.
              </p>
            </section>
          )}
          <Field
            label="Content"
            value={form.body}
            onChange={field("body")}
            multiline
            required
            maxLength={10000}
          />
          {isOrgAdmin && (
            <Check checked={form.corporate} onChange={field("corporate")}>
              Corporate resource
            </Check>
          )}
          <Check checked={form.published} onChange={field("published")}>
            Publish for staff use
          </Check>
          <p className="retail-muted">
            Editing this resource does not modify existing customer plans.
          </p>
        </>
      )}
      <Button primary disabled={busy} type="submit">
        {busy ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
