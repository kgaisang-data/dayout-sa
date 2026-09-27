import assert from "node:assert/strict";
import test from "node:test";
import { getRecommendedPlans } from "./recommendation-engine.ts";

const preferences = {
  location: "Braamfontein",
  budget: 800,
  groupSize: 4,
  availableMinutes: 360,
  vibes: ["chill", "foodie"],
};

function place(id, overrides = {}) {
  return {
    id,
    name: `Venue ${id}`,
    description: `Description for ${id}`,
    category: "Culture",
    area: "Braamfontein",
    estimated_cost_per_person: 20,
    duration_minutes: 60,
    vibes: [],
    local_business: false,
    hidden_gem: false,
    ...overrides,
  };
}

function recommend(places, overrides = {}) {
  return getRecommendedPlans({ ...preferences, ...overrides }, places);
}

function firstStop(places, strategy, overrides = {}) {
  const plan = recommend(places, { availableMinutes: 60, ...overrides })
    .find((candidate) => candidate.id === strategy);
  assert.ok(plan, `Expected a distinct ${strategy} option`);
  return plan.stops[0].id;
}

test("generates all three strategies from real records when choices differ", () => {
  const places = [
    place("match", { vibes: ["chill", "foodie"], local_business: true }),
    place("free", { estimated_cost_per_person: 0 }),
    place("gem", { hidden_gem: true, estimated_cost_per_person: 30 }),
  ];
  const plans = recommend(places, { availableMinutes: 60 });
  assert.deepEqual(plans.map((plan) => plan.title), ["Local & Easy", "Best on a Budget", "Hidden Gems"]);
  assert.deepEqual(plans.map((plan) => plan.stops[0].id), ["match", "free", "gem"]);
  for (const plan of plans) assert.ok(places.includes(plan.stops[0]));
});

test("Best Match prioritises vibe count, then area, then local businesses", () => {
  assert.equal(firstStop([
    place("more-vibes", { vibes: ["chill", "foodie"], area: "Rosebank" }),
    place("nearby-local", { vibes: ["chill"], local_business: true }),
  ], "local-easy"), "more-vibes");
  assert.equal(firstStop([
    place("nearby", { vibes: ["chill"] }),
    place("remote-local", { vibes: ["chill"], area: "Rosebank", local_business: true }),
  ], "local-easy", { location: "  BRAAMFONTEIN " }), "nearby");
  assert.equal(firstStop([
    place("local", { vibes: ["chill"], local_business: true }),
    place("cheaper", { vibes: ["chill"], estimated_cost_per_person: 0 }),
  ], "local-easy"), "local");
});

test("Budget chooses free venues, then price, then relevant vibes", () => {
  const bestMatch = place("best", { vibes: ["chill", "foodie"] });
  assert.equal(firstStop([
    bestMatch,
    place("free", { estimated_cost_per_person: 0 }),
    place("cheap", { estimated_cost_per_person: 1, vibes: ["chill"] }),
  ], "budget"), "free");
  assert.equal(firstStop([
    bestMatch,
    place("cheap", { estimated_cost_per_person: 1 }),
    place("relevant", { estimated_cost_per_person: 2, vibes: ["chill"] }),
  ], "budget"), "cheap");
  assert.equal(firstStop([
    bestMatch,
    place("free", { estimated_cost_per_person: 0 }),
    place("relevant-free", { estimated_cost_per_person: 0, vibes: ["chill"] }),
  ], "budget"), "relevant-free");
});

test("Hidden Gems prioritises hidden status, then local businesses, then vibes", () => {
  const bestMatch = place("best", { vibes: ["chill", "foodie"], local_business: true });
  assert.equal(firstStop([
    bestMatch, place("gem", { hidden_gem: true }),
  ], "hidden-gems"), "gem");
  assert.equal(firstStop([
    bestMatch,
    place("local-gem", { hidden_gem: true, local_business: true }),
    place("relevant-gem", { hidden_gem: true, vibes: ["chill"] }),
  ], "hidden-gems"), "local-gem");
  assert.equal(firstStop([
    bestMatch,
    place("local-gem", { hidden_gem: true, local_business: true }),
    place("relevant-local-gem", { hidden_gem: true, local_business: true, vibes: ["chill"] }),
  ], "hidden-gems"), "relevant-local-gem");
});

test("normalises case, hyphens, whitespace and repeated selected vibes", () => {
  assert.equal(firstStop([
    place("matching", { vibes: [" Hidden   Gems "] }),
    place("cheap", { estimated_cost_per_person: 0 }),
  ], "local-easy", { vibes: ["HIDDEN-GEMS"] }), "matching");
  assert.equal(firstStop([
    place("one-vibe", { vibes: ["chill"], estimated_cost_per_person: 0 }),
    place("two-vibes", { vibes: ["foodie", "artsy"] }),
  ], "local-easy", { vibes: ["chill", " CHILL ", "chill", "foodie", "artsy"] }), "two-vibes");
});

test("skips unaffordable stops and uses the remaining budget and time", () => {
  const plans = recommend([
    place("first", { estimated_cost_per_person: 40, duration_minutes: 50, vibes: ["chill", "foodie", "artsy"] }),
    place("too-expensive", { estimated_cost_per_person: 40, duration_minutes: 80, vibes: ["chill", "foodie"] }),
    place("fits", { estimated_cost_per_person: 10, duration_minutes: 20, vibes: ["chill"] }),
  ], { budget: 200, availableMinutes: 85, vibes: ["chill", "foodie", "artsy"] });
  assert.deepEqual(plans[0].stops.map((stop) => stop.id), ["first", "fits"]);
  assert.equal(plans[0].totalCost, 200);
  assert.equal(plans[0].costPerPerson, 50);
  assert.equal(plans[0].remainingBudget, 0);
  assert.equal(plans[0].durationMinutes, 85);
  assert.equal(plans[0].travelMinutes, 15);
});

test("counts a transfer only between stops and honours exact time limits", () => {
  const places = [place("a"), place("b")];
  assert.equal(recommend(places, { availableMinutes: 134 })[0].stops.length, 1);
  const plan = recommend(places, { availableMinutes: 135 })[0];
  assert.equal(plan.stops.length, 2);
  assert.equal(plan.durationMinutes, 135);
  assert.equal(plan.travelMinutes, 15);
  assert.equal(recommend(places, { availableMinutes: 60 })[0].travelMinutes, 0);
  assert.deepEqual(recommend(places, { availableMinutes: 59 }), []);
});

test("uses cents for decimal costs without rounding past the budget", () => {
  const places = [
    place("a", { estimated_cost_per_person: 0.1 }),
    place("b", { estimated_cost_per_person: 0.2 }),
  ];
  const plan = recommend(places, { groupSize: 3, budget: 0.9 })[0];
  assert.equal(plan.totalCost, 0.9);
  assert.equal(plan.costPerPerson, 0.3);
  assert.equal(plan.remainingBudget, 0);
  assert.equal(recommend(places, { groupSize: 3, budget: 0.899 })[0].stops.length, 1);
  assert.equal(recommend([place("c", { estimated_cost_per_person: 0.29 })], { groupSize: 1, budget: 0.29 })[0].totalCost, 0.29);
});

test("does not duplicate venues or plans even when strategy order differs", () => {
  const a = place("a", { vibes: ["chill", "foodie"] });
  const b = place("b", { estimated_cost_per_person: 0, hidden_gem: true });
  const plans = recommend([a, b, { ...a }]);
  assert.equal(plans.length, 1);
  assert.deepEqual(plans[0].stops.map((stop) => stop.id), ["a", "b"]);
  assert.equal(recommend([a]).length, 1);
  assert.deepEqual(recommend([]), []);
});

test("zero-budget plans only use free venues and infeasible requests return no plans", () => {
  const places = [place("paid"), place("free", { estimated_cost_per_person: 0 })];
  const plans = recommend(places, { budget: 0 });
  assert.equal(plans.length, 1);
  assert.deepEqual(plans[0].stops.map((stop) => stop.id), ["free"]);
  assert.deepEqual(recommend([places[0]], { budget: 0 }), []);
  for (const invalid of [
    { budget: -1 }, { budget: NaN }, { budget: Infinity },
    { groupSize: 0 }, { groupSize: 1.5 }, { groupSize: Infinity },
    { availableMinutes: 0 }, { availableMinutes: -1 }, { availableMinutes: NaN },
  ]) assert.deepEqual(recommend(places, invalid), []);
  assert.deepEqual(recommend([
    place("negative", { estimated_cost_per_person: -1 }),
    place("invalid-cost", { estimated_cost_per_person: NaN }),
    place("invalid-time", { duration_minutes: 0 }),
  ]), []);
});

test("reasons describe actual selections and acknowledge unmatched preferences", () => {
  const plan = recommend([place("selected", { area: "Rosebank", local_business: true })])[0];
  const reasons = plan.reasons.join(" ");
  assert.match(reasons, /R80.*4 people.*R800/);
  assert.match(reasons, /60 minutes.*360-minute limit/);
  assert.match(reasons, /No selected stop matches your chosen vibes/);
  assert.match(reasons, /Rosebank.*no selected stop is in Braamfontein/);
  assert.match(reasons, /Supports local businesses: Venue selected/);
  assert.match(reasons, /transport costs are excluded/);
  assert.ok(!recommend([place("pilot")], { location: "Johannesburg" })[0].reasons.some((reason) => reason.includes("no selected stop is in Johannesburg")));
});

test("all recommendations obey group budget, total time and four-stop limits", () => {
  const places = Array.from({ length: 8 }, (_, index) => place(String(index), {
    estimated_cost_per_person: index * 10,
    duration_minutes: 30 + index * 5,
    vibes: index % 2 ? ["chill", "foodie"] : ["artsy"],
    area: index % 2 ? "Braamfontein" : "Rosebank",
    hidden_gem: index % 3 === 0,
    local_business: index % 2 === 0,
  }));
  for (const budget of [0, 50, 200, 800]) {
    for (const groupSize of [1, 2, 4]) {
      for (const availableMinutes of [30, 75, 120, 360]) {
        const plans = recommend(places, { budget, groupSize, availableMinutes });
        const sets = new Set();
        assert.ok(plans.length <= 3);
        for (const plan of plans) {
          assert.ok(plan.stops.length >= 1 && plan.stops.length <= 4);
          assert.equal(new Set(plan.stops.map((stop) => stop.id)).size, plan.stops.length);
          assert.equal(plan.totalCost, plan.stops.reduce((sum, stop) => sum + stop.estimated_cost_per_person * groupSize, 0));
          assert.ok(plan.totalCost <= budget);
          assert.equal(plan.costPerPerson, plan.totalCost / groupSize);
          assert.equal(plan.durationMinutes, plan.stops.reduce((sum, stop) => sum + stop.duration_minutes, 0) + (plan.stops.length - 1) * 15);
          assert.ok(plan.durationMinutes <= availableMinutes);
          const key = JSON.stringify(plan.stops.map((stop) => stop.id).sort());
          assert.ok(!sets.has(key));
          sets.add(key);
        }
      }
    }
  }
  assert.equal(recommend(places, { budget: 10000, availableMinutes: 1000 })[0].stops.length, 4);
});

test("is deterministic and does not mutate caller-owned records or preferences", () => {
  const places = Object.freeze([
    Object.freeze(place("b", { name: "Same name", vibes: Object.freeze([]) })),
    Object.freeze(place("a", { name: "Same name", vibes: Object.freeze([]) })),
  ]);
  const input = Object.freeze({ ...preferences, vibes: Object.freeze(["chill"]) });
  const plans = getRecommendedPlans(input, places);
  assert.deepEqual(plans[0].stops.map((stop) => stop.id), ["a", "b"]);
  assert.deepEqual(getRecommendedPlans(input, [...places].reverse()), plans);
});


test("Soweto aliases count as the selected starting area", () => {
  const plans = recommend([
    place("orlando", { area: "Orlando West", vibes: ["chill"] }),
    place("rosebank", { area: "Rosebank", vibes: ["chill"] }),
  ], { location: "Soweto", availableMinutes: 60 });
  assert.equal(plans[0].stops[0].id, "orlando");
  assert.match(plans[0].reasons.join(" "), /preferred area, Soweto/);
});

test("multi-stop match plans include a feasible local business when practical", () => {
  const plans = recommend([
    place("vibe-1", { vibes: ["chill", "foodie"], estimated_cost_per_person: 10 }),
    place("vibe-2", { vibes: ["chill", "foodie"], estimated_cost_per_person: 10 }),
    place("local", { vibes: ["chill"], local_business: true, estimated_cost_per_person: 10 }),
  ], { availableMinutes: 135 });
  assert.ok(plans[0].stops.some((stop) => stop.local_business));
});
