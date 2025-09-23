# GreggsMenuTesting

Comprehensive automated testing framework for Greggs.com menu functionality covering UI, accessibility, performance, and functional testing using Playwright and TypeScript.

## Getting Started

```sh
# Install npm and Playwright deps
npm run bootstrap
```

## What you tested

### Core Functionality

- Menu item display (cards, images, names)
- Category navigation (7 categories: ALL, Breakfast, Savouries & Bakes, etc.)
- Search functionality with breakfast terms
- Filter modal operations
- Logo click (return to homepage)

### User Experience

- Cookie consent banner handling
- Search with invalid terms (error messages)
- Image loading validation
- Keyboard navigation support
- Active state management

### Accessibility

- WCAG compliance via axe
- ARIA label validation
- Screen reader compatibility
- Focus management
- Keyboard-only navigation

### Performance

- Page load times (<5000ms)
- Core Web Vitals (LCP <2500ms, FCP <1800ms)
- Large dataset handling (10-200 menu items)
- Scroll responsiveness

### Responsive Design

- Mobile (375x667) - vertical stacking
- Tablet (768x1024) - grid layout
- Desktop (1200x800) - multi-column
- Large desktop (1920x1080) - optimized layout

### Error Handling

- Network failures
- Invalid inputs
- Graceful degradation
- DOM traversal edge cases

### Data Validation

- Price ranges
- Nutrition fields
- Allergen information
- Menu item integrity

## Why you chose your approach

This comprehensive testing approach was chosen to ensure the Greggs menu website meets modern web standards across all critical areas. By combining functional, accessibility, performance, and responsive design testing in a single framework, we can catch issues that might be missed by testing these areas in isolation. The use of Playwright provides reliable cross-browser testing capabilities and excellent developer tools, while the Page Object Model pattern ensures maintainable and reusable test code.

The data-driven approach allows for scalable testing across different menu categories, search terms, and device types without duplicating test logic. Testing against the live Greggs website (rather than a mock) ensures our tests validate real user scenarios, including complex interactions like cookie consent handling and dynamic content loading. This approach provides confidence that the menu functionality works correctly for actual users across different devices and accessibility needs.

### Test Structure

- **Page Object Model** - Maintainable and reusable test components
- **Data-driven testing** - Scalable across categories and devices
- **Comprehensive coverage** - Functional, accessibility, performance, and responsive
- **Real-world testing** - Live website with actual user scenarios
- **Modern tooling** - Playwright for reliable cross-browser testing
- **Separation of concerns** - Fixtures, test data, and utilities properly organized

## How to run the tests

```sh
# Run all tests
npm run test
# Run tests with UI
npm run test:ui
```

## Notes

### A11Y

- Some interactive elements do not have an active style when they are focused with the keyboard (no visible change when things are focused):
  - https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
  - Filters dialog close button
  - Filters dialog checkboxes
  - Filters dialog buttons
  - Filters dialog buttons do not have `disabled` attr when no filters are selected so screenreaders aren't aware they're unclickable
- Filters dialog close button does not have a label
