// frontend/src/app/constants/categories.ts

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 1, name: "Electronics & Media", slug: "electronics-media" },
  { id: 2, name: "Mobile Phones", slug: "mobile-phones" },
  { id: 3, name: "Computers & Laptops", slug: "computers-laptops" },
  { id: 4, name: "Cameras & Photography", slug: "cameras-photography" },
  { id: 5, name: "Home & Living", slug: "home-living" },
  { id: 6, name: "Furniture", slug: "furniture" },
  { id: 7, name: "Grocery & Supermarket", slug: "grocery-supermarket" },
  { id: 8, name: "Fashion & Style", slug: "fashion-style" },
  { id: 9, name: "Sports & Fitness", slug: "sports-fitness" },
  { id: 10, name: "Health & Wellness", slug: "health-wellness" },
  {
    id: 11,
    name: "Cars, Motorbikes & Machinery",
    slug: "cars-motorbikes-machinery",
  },
  {
    id: 12,
    name: "Spare Parts & Accessories",
    slug: "spare-parts-accessories",
  },
  { id: 13, name: "Real Estate & Property", slug: "real-estate-property" },
  {
    id: 14,
    name: "Office Equipment & Stationery",
    slug: "office-equipment-stationery",
  },
  { id: 15, name: "Farming & Agriculture", slug: "farming-agriculture" },
  { id: 16, name: "Vacancies, Jobs & Recruitment", slug: "seeds-inputs" },
  { id: 17, name: "Food & Beverages", slug: "food-beverages" },
  {
    id: 18,
    name: "Construction & Engineering",
    slug: "construction-engineering",
  },
  {
    id: 19,
    name: "Courier & Freight Services",
    slug: "courier-freight",
  },
  { id: 20, name: "Education & Training", slug: "education-training" },
  { id: 21, name: "Art, Craft & Culture", slug: "art-craft-culture" },
  {
    id: 22,
    name: "Events & Entertainment",
    slug: "events-entertainment",
  },
  { id: 23, name: "Transport & Travel", slug: "transport-travel" },
  {
    id: 24,
    name: "Tourism & Accommodation",
    slug: "tourism-accommodation",
  },
  {
    id: 25,
    name: "Finance, Insurance & Brokers",
    slug: "finance-insurance-brokers",
  },
  {
    id: 26,
    name: "Other / Miscellaneous",
    slug: "other",
  },
];
