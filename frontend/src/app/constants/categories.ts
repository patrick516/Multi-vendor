// frontend/src/app/constants/categories.ts

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 1, name: "Electronics & Media", slug: "electronics-media" },
  { id: 2, name: "Mobile Phones & Electronics", slug: "mobile-phones" },
  { id: 3, name: "Computers & Laptops", slug: "computers-laptops" },
  { id: 4, name: "Cameras & Photography", slug: "cameras-photography" },
  { id: 5, name: "Home & Living", slug: "home-living" },
  { id: 6, name: "Furniture", slug: "furniture" },
  { id: 7, name: "Household Goods", slug: "household-goods" },
  { id: 8, name: "Grocery & Supermarket", slug: "grocery-supermarket" },
  { id: 9, name: "Fashion & Style", slug: "fashion-style" },
  { id: 10, name: "Sports & Fitness", slug: "sports-fitness" },
  { id: 11, name: "Health & Wellness", slug: "health-wellness" },
  {
    id: 12,
    name: "Cars, Motorbikes & Machinery",
    slug: "cars-motorbikes-machinery",
  },
  {
    id: 13,
    name: "Service, Spares & Accessories",
    slug: "service-spares-accessories",
  },
  { id: 14, name: "Real Estate & Property", slug: "real-estate-property" },
  {
    id: 15,
    name: "Office Equipment & Stationery",
    slug: "office-equipment-stationery",
  },
  { id: 16, name: "Farming & Agriculture", slug: "farming-agriculture" },
  { id: 17, name: "Technical & Skills", slug: "technical-skills" },
  {
    id: 18,
    name: "Vacancies, Jobs & Recruitment",
    slug: "vacancies-jobs-recruitment",
  },
  { id: 19, name: "Food & Beverages", slug: "food-beverages" },
  {
    id: 20,
    name: "Construction & Engineering",
    slug: "construction-engineering",
  },
  {
    id: 21,
    name: "Courier & Freight Services",
    slug: "courier-freight",
  },
  { id: 22, name: "Education & Training", slug: "education-training" },
  { id: 23, name: "Art, Craft & Culture", slug: "art-craft-culture" },
  {
    id: 24,
    name: "Events & Entertainment",
    slug: "events-entertainment",
  },
  { id: 25, name: "Industries & Factories", slug: "industries-factories" },
  { id: 26, name: "Clubs & Societies", slug: "clubs-societies" },
  { id: 27, name: "Religion", slug: "religion" },
  { id: 28, name: "Legal Practitioners", slug: "legal-practitioners" },
  { id: 29, name: "Transport & Travel", slug: "transport-travel" },
  {
    id: 30,
    name: "Tourism & Accommodation",
    slug: "tourism-accommodation",
  },
  {
    id: 31,
    name: "Finance, Insurance & Brokers",
    slug: "finance-insurance-brokers",
  },
  {
    id: 32,
    name: "Other / Miscellaneous",
    slug: "other",
  },
];
