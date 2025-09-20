// tests/data/test-data.ts
export const TestData = {
  categories: [
    "All",
    "Breakfast",
    "Savouries & Bakes",
    "Drinks & Snacks",
    "Sandwiches & Salads",
    "Sweet Treats",
    "Hot Food",
  ],
  searchTerms: {
    valid: ["sausage roll", "coffee", "sandwich", "pizza"],
    invalid: ["xyznonexistent", "!@#$%", ""],
    breakfast: ["bacon", "egg", "hash brown", "breakfast roll"],
  },
  priceRanges: {
    min: 0.5,
    max: 15.0,
  },
  viewports: {
    mobile: { width: 375, height: 667, name: "Mobile" },
    tablet: { width: 768, height: 1024, name: "Tablet" },
    desktop: { width: 1200, height: 800, name: "Desktop" },
    largeDesktop: { width: 1920, height: 1080, name: "Large Desktop" },
  },
  performanceThresholds: {
    pageLoadTime: 5000,
    lcp: 2500,
    fcp: 1800,
  },
  nutritionFields: ["calories", "fat", "saturates", "sugar", "salt", "protein"],
  allergens: ["gluten", "dairy", "eggs", "nuts", "soya", "sesame"],
};
