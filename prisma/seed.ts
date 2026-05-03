import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const restaurants = [
  {
    name: "Brunch",
    description: "Morning and midday favorites — eggs, pancakes, and more.",
    items: [
      { name: "Avocado Toast", description: "Sourdough with smashed avocado, cherry tomatoes, and everything bagel seasoning." },
      { name: "Eggs Benedict", description: "Poached eggs on an English muffin with Canadian bacon and hollandaise." },
      { name: "Buttermilk Pancakes", description: "Fluffy stack of three pancakes served with maple syrup and butter." },
      { name: "Veggie Omelette", description: "Three-egg omelette with bell peppers, mushrooms, onions, and cheddar." },
      { name: "French Toast", description: "Thick-cut brioche dipped in vanilla custard, griddled golden brown." },
    ],
  },
  {
    name: "Streats",
    description: "Global street food and bold flavors from around the world.",
    items: [
      { name: "Korean BBQ Tacos", description: "Bulgogi beef in flour tortillas with kimchi slaw and sriracha mayo." },
      { name: "Banh Mi Sandwich", description: "Vietnamese-style baguette with lemongrass pork, pickled daikon, and cilantro." },
      { name: "Falafel Wrap", description: "Crispy falafel, hummus, cucumber, tomato, and tzatziki in a warm pita." },
      { name: "Loaded Fries", description: "Crispy fries topped with cheese sauce, jalapeños, and sour cream." },
      { name: "Chicken Satay Bowl", description: "Grilled chicken skewers over jasmine rice with peanut sauce and cucumber." },
    ],
  },
  {
    name: "Hearth",
    description: "Comfort food made from scratch — soups, roasts, and warm sides.",
    items: [
      { name: "Tomato Bisque", description: "Creamy roasted tomato soup served with a grilled cheese crouton." },
      { name: "Roast Chicken", description: "Half roasted chicken with herb jus, roasted potatoes, and seasonal vegetables." },
      { name: "Mac & Cheese", description: "Baked four-cheese macaroni with a crispy breadcrumb topping." },
      { name: "Beef Pot Roast", description: "Slow-braised chuck roast with carrots, celery, and mashed potatoes." },
      { name: "Cornbread", description: "Skillet-baked honey cornbread with whipped butter." },
    ],
  },
  {
    name: "Mingle",
    description: "Fresh salads, grain bowls, and light bites for any time of day.",
    items: [
      { name: "Harvest Grain Bowl", description: "Farro, roasted sweet potato, kale, dried cranberries, and lemon tahini dressing." },
      { name: "Caesar Salad", description: "Romaine, house-made Caesar dressing, parmesan, and garlic croutons." },
      { name: "Caprese Flatbread", description: "Thin flatbread with fresh mozzarella, heirloom tomatoes, and basil oil." },
      { name: "Quinoa Power Bowl", description: "Quinoa, edamame, shredded carrots, cucumber, and ginger miso dressing." },
      { name: "Watermelon Feta Salad", description: "Cubed watermelon, crumbled feta, mint, and a balsamic glaze." },
    ],
  },
  {
    name: "Nosh",
    description: "Quick bites, sandwiches, and snacks to fuel your day.",
    items: [
      { name: "Turkey Club", description: "Sliced turkey, bacon, lettuce, tomato, and mayo on toasted sourdough." },
      { name: "Caprese Panini", description: "Fresh mozzarella, tomato, and basil pesto pressed on ciabatta." },
      { name: "Hummus & Veggie Plate", description: "House-made hummus with pita chips, carrots, celery, and cucumber." },
      { name: "Granola Parfait", description: "Greek yogurt layered with house granola and seasonal berries." },
      { name: "Grilled Cheese", description: "Sharp cheddar and gruyère on thick-cut white bread, griddled in butter." },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL!;
  console.log("Connecting to:", connectionString?.substring(0, 30) + "...");
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Clear existing data
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();

  for (const r of restaurants) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: r.name,
        description: r.description,
      },
    });

    for (const item of r.items) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          restaurantId: restaurant.id,
          isUserSubmitted: false,
        },
      });
    }

    console.log(`  ✓ ${r.name} (${r.items.length} items)`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
