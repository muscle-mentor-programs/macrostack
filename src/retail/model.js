export const sections = ["Today", "Customers", "Inbox", "Library", "Store"];
export const steps = ["Review customer", "Build recommendations", "Schedule follow-up", "Review & publish"];
export const initialDraft = {
  goal: "",
  preferences: "",
  barriers: "",
  private_note: "",
  guidance: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  habits: "",
  products: "",
  checkin_date: "",
  next_scan: "",
  product_followup: "",
};
export function classifyTask(task, now = Date.now()) {
  if (task.status !== "open") return "completed";
  const due = Date.parse(task.due_at);
  if (!Number.isFinite(due)) return "unscheduled";
  return due < now ? "due" : "upcoming";
}
export function displayDate(value, timezone) {
  if (!value) return "Not set";
  const d = new Date(value.length === 10 ? value + "T12:00:00" : value);
  if (!Number.isFinite(d.getTime())) return "Not set";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(d);
}
export function planIssues(draft) {
  const issues = [];
  if (!draft.goal?.trim()) issues.push("Add a customer goal.");
  if (!draft.guidance?.trim())
    issues.push("Add customer-visible nutrition guidance.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.checkin_date || ""))
    issues.push("Choose a check-in date.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.next_scan || ""))
    issues.push("Choose a return-scan date.");
  for (const field of ["calories", "protein", "carbs", "fat"])
    if (
      draft[field] !== "" &&
      draft[field] != null &&
      (!Number.isFinite(Number(draft[field])) || Number(draft[field]) < 0)
    )
      issues.push(`Enter a valid ${field} target.`);
  return issues;
}
// Strict CSV format avoids guessing customer identity, units or scan values.
export function parseAssessmentCSV(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  if (lines[0] !== "date,weight,unit,body_fat,muscle_mass")
    throw new Error(
      "Use the supplied CSV header: date,weight,unit,body_fat,muscle_mass",
    );
  if (lines.length > 101)
    throw new Error("Import up to 100 assessments at a time.");
  const seen = new Set();
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line, index) => {
      const [date, weight, unit, body_fat, muscle_mass, ...extra] = line
        .split(",")
        .map((v) => v.trim());
      const errors = [];
      if (
        extra.length ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        errors.push("Invalid date");
      if (!["kg", "lbs"].includes(unit)) errors.push("Unit must be kg or lbs");
      if (
        !weight ||
        !Number.isFinite(Number(weight)) ||
        +weight <= 0 ||
        +weight >= 1500
      )
        errors.push("Invalid weight");
      if (
        body_fat &&
        (!Number.isFinite(+body_fat) || +body_fat < 0 || +body_fat > 100)
      )
        errors.push("Invalid body-fat percentage");
      if (
        muscle_mass &&
        (!Number.isFinite(+muscle_mass) ||
          +muscle_mass < 0 ||
          +muscle_mass >= 1500)
      )
        errors.push("Invalid muscle mass");
      const source_key = `csv:${date}:${weight}:${unit}:${body_fat}:${muscle_mass}`;
      if (seen.has(source_key)) errors.push("Duplicate row");
      seen.add(source_key);
      return {
        row: index + 2,
        measured_on: date,
        weight,
        unit,
        body_fat,
        muscle_mass,
        source: "csv",
        source_key,
        errors,
      };
    });
}
export function csvDownload(rows, filename) {
  const escape = (value) =>
    '"' +
    String(value ?? "")
      .replace(/^[=+\-@]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const text = rows.map((row) => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
