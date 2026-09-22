const help = {
  Today: [
    "Start with due follow-ups. Open the customer, review context, and complete or reschedule the next action.",
    "Open conversations need a named owner and a clear next step.",
  ],
  Customers: [
    "Invite the customer with their own email and let them consent to the store connection.",
    "Use search or assignment filters to find the right relationship. Private staff notes never appear in the customer plan.",
  ],
  Inbox: [
    "Assign the conversation before replying, and resolve it when the next step is agreed.",
    "A new customer reply reopens the conversation. Never include private consultation notes in a reply.",
  ],
  Resources: [
    "Choose a published meal plan, form or guide, select a customer, then review and share it. Staff-only guides stay within your team.",
    "Managers can save, duplicate or archive resources. Edits never change copies already assigned to customers.",
  ],
  Store: [
    "Confirm store details and staff access, approve your resources, and complete the practice workflow before enrolling customers.",
    "Check reminder configuration and billing status here. Configured services still need a consenting test recipient before launch.",
  ],
};
export default function WorkspaceGuide({ section }) {
  return (
    <details className="retail-help retail-section">
      <summary>Quick guide · {section}</summary>
      <ol>
        {(help[section] || help.Today).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ol>
    </details>
  );
}
