/**
 * Flavor Engine — adaptive recommendation system for food cravings.
 *
 * Each item has three flavor dimensions, each 0–100:
 *   savorySweetness:  0 = fully savory,    100 = fully sweet
 *   healthIndulgence: 0 = fully healthy,   100 = fully indulgent
 *   lightHeaviness:   0 = fully light,     100 = fully heavy
 *
 * The core algorithm is an adaptive preference vector that updates in real time
 * based on user swipes, using weighted interpolation (similar to online learning):
 *
 *   YES  → move craving vector 30% toward item's flavor (strong positive signal)
 *   MAYBE → move craving vector 10% toward item's flavor (weak positive signal)
 *   NOPE → move craving vector 20% AWAY from item's flavor (negative signal)
 *
 * After each swipe, all remaining unseen items are re-scored against the updated
 * vector, and the best-scoring unseen item is served next.
 *
 * Session ends when:
 *   - User has 3+ "Yes" picks (enough to show good results), OR
 *   - 4 consecutive "Nope"s (user is being picky — show what we have), OR
 *   - All items have been seen
 */

export interface FlavorVector {
  savorySweetness: number;
  healthIndulgence: number;
  lightHeaviness: number;
}

export interface ScoredItem {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  averageRating: number;
  reviewCount: number;
  topImage: string | null;
  topReviews?: { id: string; rating: number; comment: string | null; likes: number }[];
  flavor: FlavorVector;
  matchScore: number;
  dataSource: "community" | "static" | "inferred" | "ai";
}

export type SwipeResponse = "yes" | "maybe" | "nope";

export interface SwipeHistoryEntry {
  itemId: string;
  response: SwipeResponse;
  flavor: FlavorVector;
}

// ─── Static flavor table ─────────────────────────────────────────────────────
const STATIC_FLAVORS: Record<string, FlavorVector> = {
  // Brunch
  "avocado toast":         { savorySweetness: 15, healthIndulgence: 20, lightHeaviness: 25 },
  "eggs benedict":         { savorySweetness: 20, healthIndulgence: 65, lightHeaviness: 60 },
  "buttermilk pancakes":   { savorySweetness: 75, healthIndulgence: 75, lightHeaviness: 55 },
  "veggie omelette":       { savorySweetness: 10, healthIndulgence: 30, lightHeaviness: 35 },
  "french toast":          { savorySweetness: 70, healthIndulgence: 70, lightHeaviness: 50 },
  // Streats
  "korean bbq tacos":      { savorySweetness: 35, healthIndulgence: 60, lightHeaviness: 55 },
  "banh mi sandwich":      { savorySweetness: 25, healthIndulgence: 45, lightHeaviness: 45 },
  "falafel wrap":          { savorySweetness: 15, healthIndulgence: 35, lightHeaviness: 40 },
  "loaded fries":          { savorySweetness: 20, healthIndulgence: 85, lightHeaviness: 75 },
  "chicken satay bowl":    { savorySweetness: 30, healthIndulgence: 50, lightHeaviness: 55 },
  // Hearth
  "tomato bisque":         { savorySweetness: 20, healthIndulgence: 55, lightHeaviness: 45 },
  "roast chicken":         { savorySweetness: 10, healthIndulgence: 45, lightHeaviness: 65 },
  "mac & cheese":          { savorySweetness: 15, healthIndulgence: 85, lightHeaviness: 80 },
  "beef pot roast":        { savorySweetness: 10, healthIndulgence: 70, lightHeaviness: 85 },
  "cornbread":             { savorySweetness: 55, healthIndulgence: 65, lightHeaviness: 50 },
  // Mingle
  "harvest grain bowl":    { savorySweetness: 25, healthIndulgence: 20, lightHeaviness: 35 },
  "caesar salad":          { savorySweetness: 20, healthIndulgence: 40, lightHeaviness: 20 },
  "caprese flatbread":     { savorySweetness: 20, healthIndulgence: 40, lightHeaviness: 35 },
  "quinoa power bowl":     { savorySweetness: 20, healthIndulgence: 15, lightHeaviness: 25 },
  "watermelon feta salad": { savorySweetness: 60, healthIndulgence: 25, lightHeaviness: 15 },
  // Nosh
  "turkey club":           { savorySweetness: 10, healthIndulgence: 50, lightHeaviness: 50 },
  "caprese panini":        { savorySweetness: 20, healthIndulgence: 45, lightHeaviness: 40 },
  "hummus & veggie plate": { savorySweetness: 15, healthIndulgence: 20, lightHeaviness: 20 },
  "granola parfait":       { savorySweetness: 65, healthIndulgence: 35, lightHeaviness: 20 },
  "grilled cheese":        { savorySweetness: 15, healthIndulgence: 75, lightHeaviness: 65 },
};

// ─── Keyword inference ────────────────────────────────────────────────────────
const KEYWORD_RULES: Array<{ words: string[]; delta: Partial<FlavorVector> }> = [
  { words: ["cake", "cookie", "brownie", "donut", "muffin", "waffle", "pancake", "syrup", "honey", "caramel", "chocolate", "vanilla", "sweet", "dessert", "fruit", "berry", "parfait", "granola"],
    delta: { savorySweetness: +35, healthIndulgence: +20 } },
  { words: ["salad", "bowl", "quinoa", "kale", "spinach", "veggie", "vegetable", "hummus", "tofu", "grain", "lentil"],
    delta: { healthIndulgence: -30, lightHeaviness: -20 } },
  { words: ["fries", "burger", "cheese", "bacon", "loaded", "fried", "crispy", "creamy", "butter", "mac"],
    delta: { healthIndulgence: +30, lightHeaviness: +25 } },
  { words: ["soup", "bisque", "broth", "stew"],
    delta: { lightHeaviness: -10, healthIndulgence: -10 } },
  { words: ["roast", "beef", "pork", "steak", "bbq"],
    delta: { savorySweetness: -20, lightHeaviness: +25 } },
  { words: ["wrap", "sandwich", "panini", "toast", "flatbread", "taco"],
    delta: { lightHeaviness: +5 } },
];

export function inferFlavor(name: string): FlavorVector {
  const lower = name.toLowerCase();
  const v: FlavorVector = { savorySweetness: 30, healthIndulgence: 50, lightHeaviness: 50 };
  for (const rule of KEYWORD_RULES) {
    if (rule.words.some((w) => lower.includes(w))) {
      if (rule.delta.savorySweetness !== undefined)
        v.savorySweetness = clamp(v.savorySweetness + rule.delta.savorySweetness);
      if (rule.delta.healthIndulgence !== undefined)
        v.healthIndulgence = clamp(v.healthIndulgence + rule.delta.healthIndulgence);
      if (rule.delta.lightHeaviness !== undefined)
        v.lightHeaviness = clamp(v.lightHeaviness + rule.delta.lightHeaviness);
    }
  }
  return v;
}

export function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

// ─── Resolve item flavor ──────────────────────────────────────────────────────
export interface RawMenuItem {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  averageRating: number;
  reviewCount: number;
  topImage: string | null;
  communityFlavor: Partial<FlavorVector> | null;
  _flavorSource?: string;
  topReviews?: { id: string; rating: number; comment: string | null; likes: number }[];
}

export function resolveItemFlavor(item: RawMenuItem): {
  flavor: FlavorVector;
  dataSource: ScoredItem["dataSource"];
} {
  const cf = item.communityFlavor;
  const hasCommunity =
    cf &&
    cf.savorySweetness != null &&
    cf.healthIndulgence != null &&
    cf.lightHeaviness != null;

  if (hasCommunity) {
    return {
      flavor: {
        savorySweetness: cf!.savorySweetness!,
        healthIndulgence: cf!.healthIndulgence!,
        lightHeaviness: cf!.lightHeaviness!,
      },
      dataSource: "community",
    };
  }
  const staticKey = item.name.toLowerCase();
  if (STATIC_FLAVORS[staticKey]) {
    return { flavor: STATIC_FLAVORS[staticKey], dataSource: "static" };
  }
  return { flavor: inferFlavor(item.name), dataSource: "inferred" };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
export function scoreItem(
  craving: FlavorVector,
  itemFlavor: FlavorVector,
  averageRating: number
): number {
  const dSS = Math.abs(craving.savorySweetness - itemFlavor.savorySweetness);
  const dHI = Math.abs(craving.healthIndulgence - itemFlavor.healthIndulgence);
  const dLH = Math.abs(craving.lightHeaviness - itemFlavor.lightHeaviness);
  const avgDistance = (dSS + dHI + dLH) / 3;
  const similarity = 100 - avgDistance;
  const ratingBonus = (averageRating / 5) * 5;
  return Math.min(100, similarity + ratingBonus);
}

// ─── Adaptive craving update ──────────────────────────────────────────────────
/**
 * Updates the craving vector based on a swipe response using weighted interpolation.
 *
 * YES:   lerp 30% toward item flavor  (strong attraction)
 * MAYBE: lerp 10% toward item flavor  (weak attraction)
 * NOPE:  lerp 20% AWAY from item flavor (repulsion — reflect through current position)
 */
export function updateCraving(
  current: FlavorVector,
  itemFlavor: FlavorVector,
  response: SwipeResponse
): FlavorVector {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  if (response === "yes") {
    return {
      savorySweetness: clamp(lerp(current.savorySweetness, itemFlavor.savorySweetness, 0.30)),
      healthIndulgence: clamp(lerp(current.healthIndulgence, itemFlavor.healthIndulgence, 0.30)),
      lightHeaviness: clamp(lerp(current.lightHeaviness, itemFlavor.lightHeaviness, 0.30)),
    };
  }
  if (response === "maybe") {
    return {
      savorySweetness: clamp(lerp(current.savorySweetness, itemFlavor.savorySweetness, 0.10)),
      healthIndulgence: clamp(lerp(current.healthIndulgence, itemFlavor.healthIndulgence, 0.10)),
      lightHeaviness: clamp(lerp(current.lightHeaviness, itemFlavor.lightHeaviness, 0.10)),
    };
  }
  // NOPE: push away — reflect the item's influence
  return {
    savorySweetness: clamp(lerp(current.savorySweetness, itemFlavor.savorySweetness, -0.20)),
    healthIndulgence: clamp(lerp(current.healthIndulgence, itemFlavor.healthIndulgence, -0.20)),
    lightHeaviness: clamp(lerp(current.lightHeaviness, itemFlavor.lightHeaviness, -0.20)),
  };
}

// ─── Session termination check ────────────────────────────────────────────────
/**
 * Returns true when the session should end.
 * Ends when: 3+ yeses, OR 4 consecutive nopes, OR no items left.
 */
export function shouldEndSession(
  history: SwipeHistoryEntry[],
  remainingCount: number
): boolean {
  if (remainingCount === 0) return true;

  const yesCount = history.filter((h) => h.response === "yes").length;
  if (yesCount >= 5) return true;

  // Count consecutive nopes from the end
  let consecutiveNopes = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].response === "nope") consecutiveNopes++;
    else break;
  }
  if (consecutiveNopes >= 6) return true;

  return false;
}

// ─── Pick next item ───────────────────────────────────────────────────────────
/**
 * Given the current craving vector and all items, returns the best unseen item.
 * Excludes items already in seenIds.
 */
export function pickNextItem(
  craving: FlavorVector,
  allItems: ScoredItem[],
  seenIds: Set<string>
): ScoredItem | null {
  const unseen = allItems
    .filter((item) => !seenIds.has(item.id))
    .map((item) => ({
      ...item,
      matchScore: scoreItem(craving, item.flavor, item.averageRating),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  return unseen[0] ?? null;
}

// ─── Initial ranking ──────────────────────────────────────────────────────────
export function buildScoredItems(
  craving: FlavorVector,
  rawItems: RawMenuItem[]
): ScoredItem[] {
  return rawItems.map((item) => {
    const { flavor, dataSource: resolvedSource } = resolveItemFlavor(item);
    // If server told us it used AI, trust that label
    const dataSource = (item._flavorSource === "ai" ? "ai" : resolvedSource) as ScoredItem["dataSource"];
    return {
      ...item,
      flavor,
      dataSource,
      matchScore: scoreItem(craving, flavor, item.averageRating),
    };
  });
}
