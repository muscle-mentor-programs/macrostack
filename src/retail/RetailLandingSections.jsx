import {
  Users,
  Utensils,
  MessageCircle,
  ClipboardList,
  Image,
  Building2,
  ShieldCheck,
  Palette,
  ArrowUpRight,
  Check,
} from "lucide-react";
const features = [
  [
    Users,
    "A complete customer picture",
    "Keep goals, consultations, notes and next steps together. With customer permission, view their food logs, weight history, progress photos and check-ins.",
  ],
  [
    Utensils,
    "Nutrition they can follow",
    "Build multi-day meal plans from the MacroStack food database. Adjust servings, set calories and macros, and publish into the customer’s app.",
  ],
  [
    MessageCircle,
    "A direct line to your team",
    "Store conversations live in the customer’s Messages tab. Your team can manage conversations, respond and keep the next step clear.",
  ],
  [
    ClipboardList,
    "Consultations with continuity",
    "Use intake forms, save consultation drafts and publish practical guidance. Keep private staff notes separate from customer-facing plans.",
  ],
  [
    Image,
    "Progress between visits",
    "Review shared photos, record assessments and request updates. Track follow-up tasks and check-ins alongside the customer record.",
  ],
  [
    Building2,
    "One location or your whole network",
    "Organize stores and staff in one business workspace, with location permissions and reporting across your organization.",
  ],
];
const faqs = [
  [
    "Do customers need a new MacroStack account?",
    "Customers who already have a MacroStack account sign in with their invited email. New customers create a user account. Both confirm the store connection before linking.",
  ],
  [
    "Can we use our own branding?",
    "Yes. An organization administrator can upload a transparent logo and choose a portal display name. Your store identity appears with “Powered by MacroStack.”",
  ],
  [
    "What appears in the customer’s app?",
    "Published store meal plans and calorie/macro targets become available in their existing nutrition app. Store chat appears in Messages. Their personal account and any coach connection remain separate.",
  ],
  [
    "Who can see customer records?",
    "Access follows staff roles and store assignments. Customers choose whether to share their existing personal app records and can turn sharing off. Separate coach conversations and private coach notes remain private.",
  ],
  [
    "Can we manage multiple locations?",
    "Yes. Create a business workspace, organize locations and give each team the appropriate access. Organization reporting brings store activity together without granting every staff member access to every customer.",
  ],
  [
    "How do we get started?",
    "Create a separate retailer account using a work email, verify your email and set up your business workspace. Add your branding and staff, then invite your first customer.",
  ],
];
export default function RetailLandingSections() {
  return (
    <div className="retail-marketing">
      <section
        className="retail-marketing-section retail-story"
        id="retailer-overview"
      >
        <div>
          <span className="retail-signup-eyebrow">
            THE RELATIONSHIP CONTINUES
          </span>
          <h2>
            Great advice.
            <br />
            <em>Everyday action.</em>
          </h2>
          <p>
            A helpful conversation should become a plan your customer can use
            tomorrow. Connect your in-store nutrition services to the habits,
            meals and progress happening between visits.
          </p>
          <a className="retail-button primary" href="#retailer-account">
            Build your store workspace <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="retail-phone-stage">
          <img
            className="retail-stage-mark"
            src="/macrostack-mark-transparent.png"
            alt=""
            aria-hidden="true"
          />
          <img
            className="retail-product-phone retail-product-phone-back"
            src="/mockups/app-log.png"
            alt="MacroStack customer app showing a daily food journal"
            loading="lazy"
          />
          <img
            className="retail-product-phone"
            src="/mockups/app-home.png"
            alt="MacroStack customer app showing daily nutrition targets and progress"
            loading="lazy"
          />
          <span className="retail-stage-caption">
            YOUR STORE. THEIR DAILY ROUTINE.
          </span>
        </div>
      </section>
      <section className="retail-marketing-section" id="retailer-features">
        <span className="retail-signup-eyebrow">
          BUILT FOR NUTRITION RETAIL
        </span>
        <h2>
          Everything your team needs.
          <br />
          <em>One connected workspace.</em>
        </h2>
        <div className="retail-marketing-features">
          {features.map(([Icon, title, body]) => (
            <article key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="retail-marketing-section retail-workflow"
        id="retailer-workflow"
      >
        <div>
          <span className="retail-signup-eyebrow">
            FROM FIRST VISIT TO FOLLOW-THROUGH
          </span>
          <h2>
            A clearer path
            <br />
            <em>for every customer.</em>
          </h2>
          <p>
            Your team has a repeatable process. Your customer has a clear next
            step.
          </p>
        </div>
        <ol>
          {[
            [
              "Invite & connect",
              "Send a customer invitation. They sign in or create an account, then confirm the connection with your branded store.",
            ],
            [
              "Understand & plan",
              "Capture their goals, complete an intake and review the information they choose to share. Build their meal plan and daily targets.",
            ],
            [
              "Support & follow up",
              "Keep the conversation going in store chat. Assign follow-up tasks, collect check-ins and request progress photos.",
            ],
            [
              "Review & refine",
              "Use the customer’s shared records and your store’s activity reporting to prepare for the next conversation.",
            ],
          ].map(([title, body], i) => (
            <li key={title}>
              <span>0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section
        className="retail-marketing-section retail-ownership"
        id="retailer-team"
      >
        <img
          src="/macrostack-mark-transparent.png"
          className="retail-ownership-mark"
          alt=""
          aria-hidden="true"
        />
        <div>
          <span className="retail-signup-eyebrow">
            YOUR BUSINESS. YOUR EXPERIENCE.
          </span>
          <h2>
            Feels like your store.
            <br />
            <em>Works as one team.</em>
          </h2>
          <p>
            A recognizable workspace for your staff and a familiar connection
            for your customers. MacroStack provides the tools behind your brand.
          </p>
        </div>
        <div className="retail-ownership-grid">
          {[
            [
              Palette,
              "Your identity",
              "Transparent logo upload and your own portal display name.",
            ],
            [
              ShieldCheck,
              "The right access",
              "Business administration, location management and assigned customer care.",
            ],
            [
              Building2,
              "Room to grow",
              "Shared resources, staff invitations and multi-location visibility.",
            ],
          ].map(([Icon, title, body]) => (
            <article key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="retail-marketing-section retail-member-benefits"
        id="retailer-customers"
      >
        <div>
          <span className="retail-signup-eyebrow">
            A BETTER CUSTOMER EXPERIENCE
          </span>
          <h2>
            The support they know.
            <br />
            <em>Now in their pocket.</em>
          </h2>
          <p>
            Customers keep using MacroStack for their daily nutrition. Your
            store becomes a connected part of that experience.
          </p>
          <ul>
            {[
              "Meal plans and daily calorie/macro targets in their app",
              "Food logging, shared progress and direct store chat",
              "Sponsored Pro access while their eligible store subscription is active",
              "Control over sharing their existing personal records",
            ].map((t) => (
              <li key={t}>
                <Check size={18} />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="retail-customer-outcomes">
          <span>IN STORE</span>
          <strong>A conversation</strong>
          <span>IN THEIR APP</span>
          <strong>A daily plan</strong>
          <span>BETWEEN VISITS</span>
          <strong>A connected team</strong>
        </div>
      </section>
      <section
        className="retail-marketing-section retail-faq"
        id="retailer-faq"
      >
        <div>
          <span className="retail-signup-eyebrow">THE DETAILS</span>
          <h2>
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h2>
        </div>
        <div>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="retail-marketing-section retail-final-cta">
        <span className="retail-signup-eyebrow">MAKE EVERY VISIT COUNT</span>
        <h2>
          Build a stronger
          <br />
          <em>customer connection.</em>
        </h2>
        <p>
          Bring your team, your nutrition services and your customer follow-up
          into one place.
        </p>
        <div className="retail-actions">
          <a className="retail-button primary" href="#retailer-account">
            Create your retailer account <ArrowUpRight size={16} />
          </a>
          <a className="retail-button" href="mailto:getmacrostack@gmail.com">
            Talk with MacroStack
          </a>
        </div>
      </section>
    </div>
  );
}
