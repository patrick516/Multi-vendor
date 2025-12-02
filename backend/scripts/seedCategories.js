// backend/scripts/seedCategories.js
const prisma = require("../config/prisma");

const categories = [
  // === CORE CATEGORIES (updated & expanded) ===
  { name: "Electronics & Media", slug: "electronics-media" },

  // renamed label, same slug so links keep working
  { name: "Mobile Phones & Electronics", slug: "mobile-phones" },

  { name: "Computers & Laptops", slug: "computers-laptops" },
  { name: "Cameras & Photography", slug: "cameras-photography" },

  { name: "Home & Living", slug: "home-living" },
  { name: "Furniture", slug: "furniture" },

  // NEW: Household Goods
  { name: "Household Goods", slug: "household-goods" },

  { name: "Grocery & Supermarket", slug: "grocery-supermarket" },

  { name: "Fashion & Style", slug: "fashion-style" },
  { name: "Sports & Fitness", slug: "sports-fitness" },

  { name: "Health & Wellness", slug: "health-wellness" },

  { name: "Cars, Motorbikes & Machinery", slug: "cars-motorbikes-machinery" },

  // renamed category to start with "Service"
  {
    name: "Service, Spares & Accessories",
    slug: "service-spares-accessories",
  },

  { name: "Real Estate & Property", slug: "real-estate-property" },
  {
    name: "Office Equipment & Stationery",
    slug: "office-equipment-stationery",
  },

  { name: "Farming & Agriculture", slug: "farming-agriculture" },

  // NEW: Technical & Skills (vocational services)
  { name: "Technical & Skills", slug: "technical-skills" },

  { name: "Vacancies, Jobs & Recruitment", slug: "vacancies-jobs-recruitment" },

  { name: "Food & Beverages", slug: "food-beverages" },
  { name: "Construction & Engineering", slug: "construction-engineering" },
  { name: "Courier & Freight Services", slug: "courier-freight" },

  { name: "Education & Training", slug: "education-training" },
  { name: "Art, Craft & Culture", slug: "art-craft-culture" },
  { name: "Events & Entertainment", slug: "events-entertainment" },

  // NEW: Industries & Factories
  { name: "Industries & Factories", slug: "industries-factories" },

  // NEW: Clubs & Societies
  { name: "Clubs & Societies", slug: "clubs-societies" },

  // NEW: Religion
  { name: "Religion", slug: "religion" },

  // NEW: Legal Practitioners
  { name: "Legal Practitioners", slug: "legal-practitioners" },

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
      where: { slug: cat.slug },
      update: { name: cat.name },
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
