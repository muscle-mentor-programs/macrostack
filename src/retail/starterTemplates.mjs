export const starterTemplates = [
  {
    key: "welcome",
    title: "New customer intake",
    category: "consultation",
    content: {
      body: "DRAFT — review with your store lead before publishing.\nWelcome the customer, explain what the store can see, and ask permission before recording information. Agree on one practical next step and when to check in. Leave unknown answers blank. Refer questions outside the team’s scope to the appropriate qualified professional.",
      questions: [
        { id: "goal", label: "What would you like support with?" },
        { id: "routine", label: "What does a typical day look like?" },
        {
          id: "preferences",
          label: "Any food preferences or restrictions you want us to know?",
        },
        { id: "barriers", label: "What usually makes consistency difficult?" },
        { id: "support", label: "What kind of follow-up would be helpful?" },
      ],
    },
  },
  {
    key: "consultation",
    title: "First consultation outline",
    category: "nutrition",
    content: {
      body: "DRAFT — store approval required.\n1. Confirm the customer’s goal in their own words.\n2. Review their intake and any measurements they choose to share.\n3. Discuss their current routine and one manageable change.\n4. Record only relevant observations in private notes.\n5. Review the customer-facing plan together.\n6. Agree on a follow-up date and communication preferences.\n7. Publish only after reviewing the exact customer-facing content.",
    },
  },
  {
    key: "checkin",
    title: "First-week follow-up",
    category: "followup",
    content: {
      body: "DRAFT — personalize and approve before use.\nSuggested timing: 7 days after the consultation, adjusted with the customer.\nAsk: What went well? What was difficult? Is the next step still realistic? What support would help?\nRecord the response, adjust the next action with the customer, and schedule the agreed follow-up. Do not treat a missing food log as zero intake or lack of effort.",
    },
  },
  {
    key: "return",
    title: "Return visit & progress review",
    category: "followup",
    content: {
      body: "DRAFT — personalize and approve before use.\nSuggested timing: agree a return visit during the consultation.\nReview the customer’s experience, questions and chosen progress measures. Confirm measurement date and units if entering a scan. Explain that records are observations, not a diagnosis. Agree the next step and date, then publish an updated plan if needed.",
    },
  },
  {
    key: "products",
    title: "Product discussion record",
    category: "product",
    content: {
      body: "DRAFT — store approval required.\nRecord the customer’s question, the product discussed, the reason for the discussion, and whether they want a follow-up. Use only approved product information. Do not make medical claims, prescribe doses, or promise outcomes. A purchase is optional and separate from the customer’s plan.",
    },
  },
];
