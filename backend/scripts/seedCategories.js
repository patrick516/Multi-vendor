// backend/scripts/seedCategories.js
const prisma = require("../config/prisma");

const categories = [
  // === FINAL 26 MERGED & CLEANED CATEGORIES ===
  { name: "Electronics & Media", slug: "electronics-media" },
  { name: "Mobile Phones", slug: "mobile-phones" },
  { name: "Computers & Laptops", slug: "computers-laptops" },
  { name: "Cameras & Photography", slug: "cameras-photography" },
  { name: "Home & Living", slug: "home-living" },
  { name: "Furniture", slug: "furniture" },

  { name: "Grocery & Supermarket", slug: "grocery-supermarket" },

  { name: "Fashion & Style", slug: "fashion-style" },
  { name: "Sports & Fitness", slug: "sports-fitness" },

  { name: "Health & Wellness", slug: "health-wellness" },

  { name: "Cars, Motorbikes & Machinery", slug: "cars-motorbikes-machinery" },
  { name: "Spare Parts & Accessories", slug: "spare-parts-accessories" },

  { name: "Real Estate & Property", slug: "real-estate-property" },
  {
    name: "Office Equipment & Stationery",
    slug: "office-equipment-stationery",
  },

  { name: "Farming & Agriculture", slug: "farming-agriculture" },
  { name: "Vacancies, Jobs & Recruitment", slug: "vacancies-jobs-recruitment" },

  { name: "Food & Beverages", slug: "food-beverages" },
  { name: "Construction & Engineering", slug: "construction-engineering" },
  { name: "Courier & Freight Services", slug: "courier-freight" },

  { name: "Education & Training", slug: "education-training" },
  { name: "Art, Craft & Culture", slug: "art-craft-culture" },
  { name: "Events & Entertainment", slug: "events-entertainment" },

  { name: "Transport & Travel", slug: "transport-travel" },
  { name: "Tourism & Accommodation", slug: "tourism-accommodation" },

  { name: "Finance, Insurance & Brokers", slug: "finance-insurance-brokers" },

  // Always last
  { name: "Other / Miscellaneous", slug: "other" },
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug },
    });
  }

  console.log("Done seeding categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
