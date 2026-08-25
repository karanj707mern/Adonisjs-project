import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Define the critical e-commerce URLs you want to audit for legal risk
const TARGET_URLS = [
  "http://localhost:3000/", // 1. Homepage
  "http://localhost:3000/products", // 2. Product Listing Page (Grid view)
  "http://localhost:3000/products/your-real-product", // 3. Product Detail Page (Swatches, +, - controls)
  "http://localhost:3000/cart", // 4. Shopping Cart Drawer/Page
  "http://localhost:3000/checkout", // 5. Checkout & Payment Interface
];

for (const url of TARGET_URLS) {
  test(`Audit Accessibility for: ${url}`, async ({ page }) => {
    // 1. Navigate to the page and wait for dynamic components to load completely
    await page.goto(url);
    await page.waitForLoadState("networkidle");

    // 2. Configure the Axe scanner to specifically target missing names/labels
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules([
        "button-name", // Ensures all buttons have discernible text/ARIA labels
        "aria-allowed-attr", // Checks if ARIA attributes are valid
        "input-image-alt", // Checks for missing alt text on image input buttons
        "label", // Ensures form elements have connected labels
        "link-name", // Ensures links have descriptive accessible text
      ])
      .analyze();

    // 3. Extract and cleanly format the violations for your development team
    const violations = accessibilityScanResults.violations;

    if (violations.length > 0) {
      console.error(
        `\n❌ Found ${violations.length} HIGH-RISK WCAG/IS 17802 failures on: ${url}`,
      );

      violations.forEach((violation) => {
        console.error(
          `\n⚠️ Rule Broken: [${violation.id}] - ${violation.help}`,
        );
        console.error(`🔗 Legal Impact: Violates India's RPwD Act 2016.`);

        violation.nodes.forEach((node, index) => {
          console.error(`   ${index + 1}. Broken Element Code: ${node.html}`);
          console.error(`      Target Selector: ${node.target.join(", ")}`);
        });
      });
    }

    // 4. Force the test to fail if any missing label violations are found
    expect(violations.length).toBe(0);
  });
}
