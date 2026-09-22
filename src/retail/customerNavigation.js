export const primarySections = [
  "Overview",
  "Plan",
  "Food journal",
  "Progress",
  "Check-ins",
  "Messages",
];
export const secondarySections = [
  "Intake",
  "Private notes",
  "History",
  "Preferences",
];
export const sectionLabel = (t) =>
  ({
    Plan: "Nutrition",
    Messages: "Chat",
    History: "History & exports",
    Preferences: "Connection settings",
  })[t] || t;
export const normalizeSection = (t) => (t === "App records" ? "Plan" : t);
