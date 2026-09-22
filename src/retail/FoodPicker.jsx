import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { rankFoods } from "../utils/foodSearch";
import { retailerFoods } from "./api";
import { Alert, Button, Field } from "./ui";
const macroKeys = ["calories", "protein", "carbs", "fat"];
export default function FoodPicker({ meal, onAdd, onClose }) {
  const [foods, setFoods] = useState([]),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(null),
    [quantity, setQuantity] = useState("1"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [limit, setLimit] = useState(30),
    [retry, setRetry] = useState(0);
  const deferred = useDeferredValue(query);
  useEffect(() => {
    let active = true;
    Promise.all([import("../data/foods"), retailerFoods()])
      .then(([base, custom]) => {
        if (active) {
          setFoods([...base.FOODS, ...custom]);
          setLoading(false);
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not load the food database. Try again.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const results = useMemo(() => rankFoods(foods, deferred), [foods, deferred]);
  const valid =
    Number.isFinite(Number(quantity)) &&
    Number(quantity) > 0 &&
    Number(quantity) <= 20000;
  const macros = selected
    ? Object.fromEntries(
        macroKeys.map((k) => [
          k,
          Math.round((Number(selected[k]) || 0) * Number(quantity) * 10) / 10,
        ]),
      )
    : null;
  const amountUnit =
    selected &&
    ["g", "ml", "oz", "fl oz", "L", "lb"].includes(selected.servingUnit)
      ? selected.servingUnit
      : "g";
  return (
    <section
      className="retail-card retail-food-picker"
      aria-label={`Food database for ${meal}`}
    >
      <div className="retail-header">
        <h3>Add food to {meal}</h3>
        <Button type="button" onClick={onClose}>
          Close search
        </Button>
      </div>
      <Field
        label="Search food database"
        value={query}
        onChange={(v) => {
          setQuery(v);
          setLimit(30);
        }}
        placeholder="Food name or brand"
        type="search"
      />
      <Alert error={error} />
      {error && (
        <Button
          type="button"
          onClick={() => {
            setLoading(true);
            setRetry((v) => v + 1);
          }}
        >
          Retry food database
        </Button>
      )}
      {loading ? (
        <p role="status">Loading food database…</p>
      ) : (
        <>
          <p className="retail-muted">
            {results.length.toLocaleString()} foods · same database as the coach
            builder
          </p>
          <div className="retail-food-results">
            {results.slice(0, limit).map((f) => (
              <button
                type="button"
                key={f.id}
                className="retail-food-result"
                aria-pressed={selected?.id === f.id}
                onClick={() => {
                  setSelected(f);
                  setQuantity("1");
                }}
              >
                <strong>{f.name}</strong>
                <span>
                  {f.brand} · {f.calories} kcal · {f.servingSize || 1}{" "}
                  {f.servingUnit || "g"} per serving
                </span>
              </button>
            ))}
            {!results.length && (
              <p>No foods found. Try a different name or brand.</p>
            )}
          </div>
          {results.length > limit && (
            <Button type="button" onClick={() => setLimit((v) => v + 30)}>
              Show more foods
            </Button>
          )}
        </>
      )}
      {selected && (
        <div className="retail-food-selection">
          <h4>{selected.name}</h4>
          <div className="retail-fields">
            <Field
              label="Servings"
              type="number"
              min="0.01"
              max="20000"
              step="any"
              value={quantity}
              onChange={setQuantity}
            />
            {Number(selected.servingSize) > 0 && (
              <Field
                label={`Amount · ${amountUnit}`}
                type="number"
                min="0.01"
                step="any"
                value={
                  quantity === ""
                    ? ""
                    : Math.round(
                        Number(quantity) * selected.servingSize * 100,
                      ) / 100
                }
                onChange={(v) =>
                  setQuantity(
                    v === "" ? "" : String(Number(v) / selected.servingSize),
                  )
                }
              />
            )}
          </div>
          <p>
            {valid
              ? `${macros.calories} kcal · ${macros.protein}g protein · ${macros.carbs}g carbs · ${macros.fat}g fat`
              : "Enter a valid serving amount."}
          </p>
          <Button
            type="button"
            primary
            disabled={!valid}
            onClick={() => {
              onAdd({
                id: crypto.randomUUID(),
                foodId: selected.id,
                name: selected.name,
                brand: selected.brand || "",
                quantity: Number(quantity),
                servingSize: selected.servingSize,
                servingUnit: selected.servingUnit || "g",
                perServing: Object.fromEntries(
                  macroKeys.map((k) => [k, Number(selected[k]) || 0]),
                ),
                ...macros,
              });
              setSelected(null);
              setQuery("");
            }}
          >
            Add selected food
          </Button>
        </div>
      )}
    </section>
  );
}
