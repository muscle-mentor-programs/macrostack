import FoodPicker from "./FoodPicker";
import LoadingSplash from "../components/LoadingSplash";
import { useEffect, useState } from "react";
import { publishNutrition, storeMealPlans, setStoreTargets } from "./api";
import { Alert, Button, Field, Select, Modal, useAction } from "./ui";
const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];
const makeDay = (label) => ({
  id: crypto.randomUUID(),
  label,
  meals: Object.fromEntries(meals.map((m) => [m, []])),
});
export default function NutritionEditor({ relationship, onClose }) {
  const [name, setName] = useState("My store meal plan"),
    [days, setDays] = useState(() => [makeDay("Day 1")]),
    [dayIndex, setDayIndex] = useState(0);
  const [targets, setTargets] = useState({
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    }),
    [requestId, setRequestId] = useState(() => crypto.randomUUID()),
    [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [foodMeal, setFoodMeal] = useState(null);
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    storeMealPlans(relationship.id)
      .then((plans) => {
        if (!active) return;
        const latest = plans?.[0];
        if (latest) {
          setName(latest.plan_name);
          setDays(latest.days);
          setTargets(
            latest.retail_targets || {
              calories: "",
              protein: "",
              carbs: "",
              fat: "",
            },
          );
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [relationship.id, setError]);
  if (loading)
    return (
      <Modal wide title="Meal plan & daily targets" onClose={onClose}>
        <LoadingSplash label="Opening nutrition editor…" />
      </Modal>
    );
  function changeFood(meal, id, key, value) {
    setDays((ds) =>
      ds.map((d, i) =>
        i !== dayIndex
          ? d
          : {
              ...d,
              meals: {
                ...d.meals,
                [meal]: d.meals[meal].map((f) =>
                  f.id === id
                    ? {
                        ...f,
                        [key]: value,
                        ...(key === "quantity" && f.perServing
                          ? Object.fromEntries(
                              Object.entries(f.perServing).map(([k, v]) => [
                                k,
                                Math.round(Number(v) * Number(value) * 10) / 10,
                              ]),
                            )
                          : {}),
                        ...(f.perServing &&
                        ["calories", "protein", "carbs", "fat"].includes(key)
                          ? {
                              perServing: {
                                ...f.perServing,
                                [key]:
                                  Number(value) / (Number(f.quantity) || 1),
                              },
                            }
                          : {}),
                      }
                    : f,
                ),
              },
            },
      ),
    );
  }
  return (
    <Modal wide title="Meal plan & daily targets" onClose={onClose}>
      <p>
        Publish directly to {relationship.name}’s MacroStack home page. This
        replaces their active meal plan and daily targets, including targets
        previously set by a coach.
      </p>
      <Alert error={error} />
      {notice && <p role="status">{notice}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const normalized = days.map((d) => ({
              ...d,
              meals: Object.fromEntries(
                Object.entries(d.meals).map(([m, foods]) => [
                  m,
                  foods.map((f) => ({
                    ...f,
                    quantity: Number(f.quantity),
                    servingSize:
                      f.servingSize ||
                      (["g", "ml", "oz", "lb"].includes(f.servingUnit)
                        ? 1
                        : null),
                    calories: Number(f.calories),
                    protein: Number(f.protein),
                    carbs: Number(f.carbs),
                    fat: Number(f.fat),
                  })),
                ]),
              ),
            }));
            if (
              !normalized.some((d) =>
                Object.values(d.meals).some((fs) => fs.length),
              )
            )
              throw new Error(
                "Add at least one food before publishing a meal plan.",
              );
            await publishNutrition(
              relationship.id,
              requestId,
              name,
              normalized,
              Object.fromEntries(
                Object.entries(targets).map(([k, v]) => [k, Number(v)]),
              ),
            );
            setNotice(
              "Published. Their active meal plan and nutrition targets are updated.",
            );
            setRequestId(crypto.randomUUID());
          });
        }}
      >
        <Field
          label="Plan name"
          value={name}
          onChange={setName}
          required
          maxLength={120}
        />
        <h3>Daily targets</h3>
        <div className="retail-fields">
          {Object.keys(targets).map((k) => (
            <Field
              key={k}
              label={k === "calories" ? "Calories · kcal" : `${k} · g`}
              type="number"
              min={k === "calories" ? 1 : 0}
              max={k === "calories" ? 20000 : 2000}
              step="any"
              required
              value={targets[k]}
              onChange={(v) => setTargets((t) => ({ ...t, [k]: v }))}
            />
          ))}
        </div>
        <div className="retail-actions">
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (
                  Object.entries(targets).some(
                    ([k, v]) =>
                      v === "" ||
                      !Number.isFinite(Number(v)) ||
                      Number(v) < (k === "calories" ? 1 : 0) ||
                      Number(v) > (k === "calories" ? 20000 : 2000),
                  )
                )
                  throw new Error(
                    "Enter valid calories, protein, carbs and fat targets.",
                  );
                await setStoreTargets(
                  relationship.id,
                  Object.fromEntries(
                    Object.entries(targets).map(([k, v]) => [k, Number(v)]),
                  ),
                );
                setNotice(
                  "Daily targets updated. Their active meal plan is unchanged.",
                );
              })
            }
          >
            Save targets only
          </Button>
        </div>
        <div className="retail-actions">
          <Select
            label="Plan day"
            value={dayIndex}
            onChange={(v) => setDayIndex(Number(v))}
          >
            {days.map((d, i) => (
              <option key={d.id} value={i}>
                {d.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            disabled={days.length >= 14}
            onClick={() => {
              setDays((ds) => [...ds, makeDay(`Day ${ds.length + 1}`)]);
              setDayIndex(days.length);
            }}
          >
            Add day
          </Button>
          {days.length > 1 && (
            <Button
              type="button"
              onClick={() => {
                setDays((ds) => ds.filter((_, i) => i !== dayIndex));
                setDayIndex(0);
              }}
            >
              Remove day
            </Button>
          )}
        </div>
        <Field
          label="Day label"
          maxLength={100}
          value={days[dayIndex].label}
          onChange={(v) =>
            setDays((ds) =>
              ds.map((d, i) => (i === dayIndex ? { ...d, label: v } : d)),
            )
          }
        />
        <Button
          type="button"
          disabled={days.length >= 14}
          onClick={() => {
            const copy = structuredClone(days[dayIndex]);
            copy.id = crypto.randomUUID();
            copy.label = `Day ${days.length + 1}`;
            for (const foods of Object.values(copy.meals))
              for (const food of foods) food.id = crypto.randomUUID();
            setDays((ds) => [...ds, copy]);
            setDayIndex(days.length);
          }}
        >
          Duplicate this day
        </Button>
        <p className="retail-muted">
          Day totals:{" "}
          {["calories", "protein", "carbs", "fat"]
            .map(
              (k) =>
                `${Math.round(
                  Object.values(days[dayIndex].meals)
                    .flat()
                    .reduce((sum, f) => sum + (Number(f[k]) || 0), 0),
                )}${k === "calories" ? " kcal" : `g ${k}`}`,
            )
            .join(" · ")}
        </p>
        <div className="retail-meal-grid">
          {meals.map((meal) => (
            <section className="retail-card retail-meal-editor" key={meal}>
              <div className="retail-header">
                <h3>{meal}</h3>
                <Button
                  type="button"
                  onClick={() => setFoodMeal(foodMeal === meal ? null : meal)}
                >
                  Search food database
                </Button>
              </div>
              {foodMeal === meal && (
                <FoodPicker
                  meal={meal}
                  onClose={() => setFoodMeal(null)}
                  onAdd={(food) => {
                    if (days[dayIndex].meals[meal].length >= 40) {
                      setError("Each meal can contain up to 40 foods.");
                      return;
                    }
                    setDays((ds) =>
                      ds.map((d, i) =>
                        i !== dayIndex
                          ? d
                          : {
                              ...d,
                              meals: {
                                ...d.meals,
                                [meal]: [...d.meals[meal], food],
                              },
                            },
                      ),
                    );
                    setFoodMeal(null);
                  }}
                />
              )}
              {days[dayIndex].meals[meal].map((f) => (
                <div className="retail-food-editor" key={f.id}>
                  <Field
                    label="Food name"
                    required
                    maxLength={200}
                    value={f.name}
                    onChange={(v) => changeFood(meal, f.id, "name", v)}
                  />
                  <div className="retail-fields">
                    <Field
                      label={f.foodId ? "Servings" : "Quantity"}
                      type="number"
                      min="0.01"
                      max="20000"
                      step="any"
                      required
                      value={f.quantity}
                      onChange={(v) => changeFood(meal, f.id, "quantity", v)}
                    />
                    <Field
                      label="Unit (e.g. bowl, bar)"
                      value={f.servingUnit}
                      maxLength={40}
                      onChange={(v) => changeFood(meal, f.id, "servingUnit", v)}
                    />
                  </div>
                  <p className="retail-muted">
                    Macros for the entire amount above
                  </p>
                  <div className="retail-fields">
                    {["calories", "protein", "carbs", "fat"].map((k) => (
                      <Field
                        key={k}
                        label={
                          k === "calories" ? "Calories · kcal" : `${k} · g`
                        }
                        type="number"
                        required
                        min="0"
                        max="20000"
                        step="any"
                        value={f[k]}
                        onChange={(v) => changeFood(meal, f.id, k, v)}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      setDays((ds) =>
                        ds.map((d, i) =>
                          i !== dayIndex
                            ? d
                            : {
                                ...d,
                                meals: {
                                  ...d.meals,
                                  [meal]: d.meals[meal].filter(
                                    (x) => x.id !== f.id,
                                  ),
                                },
                              },
                        ),
                      )
                    }
                  >
                    Remove food
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                disabled={days[dayIndex].meals[meal].length >= 40}
                onClick={() =>
                  setDays((ds) =>
                    ds.map((d, i) =>
                      i !== dayIndex
                        ? d
                        : {
                            ...d,
                            meals: {
                              ...d.meals,
                              [meal]: [
                                ...d.meals[meal],
                                {
                                  id: crypto.randomUUID(),
                                  name: "",
                                  quantity: 1,
                                  servingUnit: "serving",
                                  calories: "",
                                  protein: "",
                                  carbs: "",
                                  fat: "",
                                },
                              ],
                            },
                          },
                    ),
                  )
                }
              >
                Add food
              </Button>
            </section>
          ))}
        </div>
        <Button primary type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish meal plan & targets"}
        </Button>
      </form>
    </Modal>
  );
}
