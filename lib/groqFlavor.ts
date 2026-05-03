/**
 * Groq AI flavor inference.
 * Called only for items with no community data and no keyword match.
 * Results are cached in-memory so the same item name is never called twice
 * within a server session.
 */

import type { FlavorVector } from "@/lib/flavorEngine";

const cache = new Map<string, FlavorVector>();

export function clearFlavorCache() {
  cache.clear();
}

export async function inferFlavorWithAI(itemName: string): Promise<FlavorVector | null> {
  const key = itemName.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `You are a food expert. Rate this menu item on three scales from 0 to 100.

Menu item: "${itemName}"

Scale definitions (be precise):
- savorySweetness: 0 = completely savory (like steak, fries, eggs), 100 = completely sweet (like cake, candy, syrup). Most savory foods score 0-30, most sweet foods score 70-100.
- healthIndulgence: 0 = very healthy (like salad, fruit, grilled chicken), 100 = very indulgent (like fried food, cheesy dishes, desserts). 
- lightHeaviness: 0 = very light (like salad, broth, fruit), 100 = very heavy/filling (like steak, pasta, burgers).

Examples:
- Chocolate cake: savorySweetness=90, healthIndulgence=90, lightHeaviness=70
- Caesar salad: savorySweetness=15, healthIndulgence=35, lightHeaviness=20
- Mac and cheese: savorySweetness=10, healthIndulgence=85, lightHeaviness=80
- Fruit smoothie: savorySweetness=75, healthIndulgence=30, lightHeaviness=15

Respond with ONLY a JSON object, no explanation:
{"savorySweetness": <number>, "healthIndulgence": <number>, "lightHeaviness": <number>}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 60,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Extract JSON from response
    const match = text.match(/\{[^}]+\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    const flavor: FlavorVector = {
      savorySweetness: clamp(Number(parsed.savorySweetness)),
      healthIndulgence: clamp(Number(parsed.healthIndulgence)),
      lightHeaviness: clamp(Number(parsed.lightHeaviness)),
    };

    console.log(`[Groq AI] Flavor for "${itemName}":`, flavor);
    cache.set(key, flavor);
    return flavor;
  } catch (e) {
    console.error(`[Groq AI] Failed for "${itemName}":`, e);
    return null;
  }
}

function clamp(v: number): number {
  return isNaN(v) ? 50 : Math.min(100, Math.max(0, v));
}
