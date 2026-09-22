import {resourceCommand} from './resourcesApi';
import {RetailThemeContext} from "./ThemeContext";
import {withCalculatedCalories} from "./nutritionTargets";
import { useEffect, useState, useContext } from "react";
import MealPlanBuilder from "../pages/coach/MealPlanBuilder";
import LoadingSplash from "../components/LoadingSplash";
import {
  publishNutrition,
  storeMealPlans,
  setStoreTargets,
  retailerFoods,
  nutritionState,
} from "./api";
import { Alert, Button, Field, Modal, useAction } from "./ui";
export default function NutritionEditor({ relationship, onClose, resource, resourceMessage, requestIdOverride, onPublished }) {
  const themeStyle=useContext(RetailThemeContext);
  const [loaded, setLoaded] = useState(null);
  const [targets, setTargets] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [requestId] = useState(() => crypto.randomUUID());
  const [notice, setNotice] = useState("");
  const { busy, error, run, setError } = useAction();
  useEffect(() => {
    let active = true;
    Promise.all([
      storeMealPlans(relationship.id),
      retailerFoods(),
      nutritionState(relationship.id),
    ])
      .then(([plans, foods, state]) => {
        if (!active) return;
        const plan = plans?.[0];
        setTargets(state.targets);
        setLoaded({
          foods,
          state,
          plan: resource ? {id:resource.id, planName:resource.title, days:structuredClone(resource.content.days)} : plan ? { ...plan, planName: plan.plan_name } : null,
        });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [relationship.id, resource, setError]);
  const computedTargets=withCalculatedCalories(targets);
  function validTargets() {
    for (const [k, v] of Object.entries(computedTargets))
      if (
        v === "" ||
        !Number.isFinite(Number(v)) ||
        Number(v) < (k === "calories" ? 1 : 0) ||
        Number(v) > (k === "calories" ? 20000 : 2000)
      )
        throw new Error(
          "Enter valid calories, protein, carbs and fat targets.",
        );
    return {
      ...Object.fromEntries(
        Object.entries(computedTargets).map(([k, v]) => [k, Number(v)]),
      ),
      _client_id: loaded.state.client_id,
      _version: loaded.state.version,
    };
  }
  if (!loaded)
    return (
      <Modal wide title="Meal plan & daily targets" onClose={onClose}>
        {error ? (
          <Alert error={error} />
        ) : (
          <LoadingSplash label="Opening nutrition editor…" />
        )}
      </Modal>
    );
  return (
    <MealPlanBuilder
      themeStyle={themeStyle}
      createPDF={async (plan, client) => {
        const {loadPlanBranding,generateRetailPlanPDF} = await import("./planPDF");
        return generateRetailPlanPDF(plan, client, await loadPlanBranding(relationship.location_id));
      }}
      client={{
        id: relationship.id,
        name: relationship.name,
        goals: Object.fromEntries(
          Object.entries(computedTargets).map(([k, v]) => [k, Number(v)]),
        ),
      }}
      initialPlan={loaded.plan}
      additionalFoods={loaded.foods}
      draftScope="retail"
      maxDays={14}
      allowEmail={false}
      saveLabel="PUBLISH PLAN"
      onClose={onClose}
      onSave={async (plan) => {
        const t = validTargets();
        if (
          !plan.days.some((d) =>
            Object.values(d.meals).some((foods) => foods.length),
          )
        )
          throw new Error("Add at least one food before publishing.");
        if (
          plan.days.some((d) =>
            Object.values(d.meals).some((foods) => foods.length > 40),
          )
        )
          throw new Error("Each meal can contain up to 40 foods.");
        if (
          loaded.state.active_plan_id &&
          !window.confirm(
            `Replace the active app meal plan (${loaded.state.active_plan_name || "current plan"}) with this store plan? Its history will remain available.`,
          )
        )
          throw new Error(
            "Publishing canceled. Your draft is still available.",
          );
        if(resource) {
          await resourceCommand('assign',{resource_id:resource.id,resource_version:resource.version,relationship_id:relationship.id,request_id:requestIdOverride||requestId,title:plan.planName,days:plan.days,targets:t,message:resourceMessage||''});
          await onPublished?.();
        } else await publishNutrition(
          relationship.id,
          requestId,
          plan.planName,
          plan.days,
          t,
        );
      }}
      toolbarContent={
        <details className="retail retail-builder-targets">
          <summary>
            Daily calorie & macro targets{" "}
            <span>
              {computedTargets.calories
                ? `${computedTargets.calories} kcal · ${targets.protein}p · ${targets.carbs}c · ${targets.fat}f`
                : "Set targets before publishing"}
            </span>
          </summary>
          <div className="retail-fields">
            {Object.keys(targets).map((k) => (
              <Field
                key={k}
                label={k === "calories" ? "Calories · kcal" : `${k} · g`}
                type="number"
                min={k === "calories" ? 1 : 0}
                max={k === "calories" ? 20000 : 2000}
                step="any"
                value={computedTargets[k]}
                readOnly={k === "calories"}
                aria-readonly={k === "calories" || undefined}
                className={k === "calories" ? "retail-calculated-calories" : undefined}
                onChange={(v) => setTargets((t) => ({ ...t, [k]: v }))}
              />
            ))}
          </div>
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await setStoreTargets(relationship.id, validTargets());
                const state = await nutritionState(relationship.id);
                setLoaded((l) => ({ ...l, state }));
                setNotice("Daily targets updated.");
              })
            }
          >
            Save targets only
          </Button>
          <p className="retail-muted">
            Publishing assigns this meal plan and these targets to the
            customer’s app.
          </p>
          <Alert error={error} />
          {error && (
            <Button
              onClick={() =>
                run(async () => {
                  const state = await nutritionState(relationship.id);
                  setTargets(state.targets);
                  setLoaded((l) => ({ ...l, state }));
                  setNotice(
                    "Current targets reloaded. Review them before saving.",
                  );
                })
              }
            >
              Reload current targets
            </Button>
          )}
          {notice && <p role="status">{notice}</p>}
        </details>
      }
    />
  );
}
