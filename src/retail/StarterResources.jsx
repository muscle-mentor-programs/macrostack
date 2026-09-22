import { Button } from "./ui";
import { starterTemplates } from "./starterTemplates.mjs";
export default function StarterResources({ onChoose }) {
  return (
    <details className="retail-help retail-section">
      <summary>Start with an editable draft</summary>
      <p>
        These outlines are starting points for your team. Review and adapt them
        before publishing; none are approved 5 Star materials.
      </p>
      <div className="retail-grid">
        {starterTemplates.map((t) => (
          <article className="retail-card" key={t.key}>
            <span className="retail-badge">Draft outline</span>
            <h3>{t.title}</h3>
            <p>
              {t.category === "consultation"
                ? "Five optional intake questions."
                : "An editable staff guide."}
            </p>
            <Button
              onClick={() =>
                onChoose({
                  title: t.title,
                  category: t.category,
                  content: structuredClone(t.content),
                  published: false,
                  location_id: "draft-local",
                })
              }
            >
              Review draft
            </Button>
          </article>
        ))}
      </div>
    </details>
  );
}
