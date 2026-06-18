import { test, expect, type Page } from "@playwright/test";

function overlay(page: Page) {
  return page.locator("#cmd-overlay");
}
function trigger(page: Page) {
  return page.locator("#cmd-trigger");
}
function input(page: Page) {
  return page.locator("#cmd-input");
}
function cmdItems(page: Page) {
  return page.locator("[data-cmd-item]");
}

test.describe("Command palette", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
  });

  test("trigger button is visible on desktop viewport", async ({ page }) => {
    await expect(trigger(page)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-label", "Open navigation search (Ctrl+K)");
  });

  test("clicking button opens the palette", async ({ page }) => {
    await expect(overlay(page)).not.toHaveClass(/open/);
    await trigger(page).click();
    await expect(overlay(page)).toHaveClass(/open/);
  });

  test("keyboard shortcut Ctrl+K opens the palette", async ({ page }) => {
    await expect(overlay(page)).not.toHaveClass(/open/);
    await page.keyboard.press("Control+k");
    await expect(overlay(page)).toHaveClass(/open/);
  });

  test("keyboard shortcut Meta+K (Mac) opens the palette", async ({ page }) => {
    await expect(overlay(page)).not.toHaveClass(/open/);
    await page.keyboard.press("Meta+k");
    await expect(overlay(page)).toHaveClass(/open/);
  });

  test("Escape closes the palette", async ({ page }) => {
    await trigger(page).click();
    await expect(overlay(page)).toHaveClass(/open/);
    await page.keyboard.press("Escape");
    await expect(overlay(page)).not.toHaveClass(/open/);
  });

  test("clicking outside (overlay backdrop) closes the palette", async ({ page }) => {
    await trigger(page).click();
    await expect(overlay(page)).toHaveClass(/open/);

    // Click the overlay backdrop itself (not a child element)
    await overlay(page).click({ position: { x: 10, y: 10 } });
    await expect(overlay(page)).not.toHaveClass(/open/);
  });

  test("Ctrl+K toggles palette when already open", async ({ page }) => {
    await trigger(page).click();
    await expect(overlay(page)).toHaveClass(/open/);
    await page.keyboard.press("Control+k");
    await expect(overlay(page)).not.toHaveClass(/open/);
  });

  test("focus moves to input when palette opens", async ({ page }) => {
    await trigger(page).click();
    await expect(overlay(page)).toHaveClass(/open/);
    await expect(input(page)).toBeFocused();
  });

  test("all navigation items are rendered in the palette", async ({ page }) => {
    await trigger(page).click();
    const items = cmdItems(page);
    await expect(items).toHaveCount(9);

    const labels = await items.allTextContents();
    expect(labels[0]).toContain("Services");
    expect(labels[1]).toContain("Why GitByte DOO");
    expect(labels[2]).toContain("Work");
    expect(labels[3]).toContain("Tech Stack");
    expect(labels[4]).toContain("Architecture");
    expect(labels[5]).toContain("Production Maturity");
    expect(labels[6]).toContain("Open Source");
    expect(labels[7]).toContain("About");
    expect(labels[8]).toContain("Contact");
  });

  test("typing filters palette items", async ({ page }) => {
    await trigger(page).click();
    await input(page).fill("stack");
    const items = cmdItems(page);
    await expect(items).toHaveCount(1);
    await expect(items).toContainText("Tech Stack");
  });

  test("unmatched query shows no-results message", async ({ page }) => {
    await trigger(page).click();
    await input(page).fill("zzznotfound");
    await expect(cmdItems(page)).toHaveCount(0);
    await expect(page.locator("#cmd-results")).toContainText("No results");
  });

  test("clicking a palette item scrolls to the target section", async ({ page }) => {
    await trigger(page).click();
    const contactItem = cmdItems(page).filter({ hasText: "Contact" });
    await contactItem.click();

    await expect(overlay(page)).not.toHaveClass(/open/);

    const section = page.locator("section#contact");
    await expect(section).toBeInViewport();
  });

  test("keyboard navigation: arrow down and enter selects an item", async ({ page }) => {
    await trigger(page).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(overlay(page)).not.toHaveClass(/open/);

    const section = page.locator("section#why-us");
    await expect(section).toBeInViewport();
  });

  test("keyboard navigation: arrow up selects first item", async ({ page }) => {
    await trigger(page).click();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");

    await expect(overlay(page)).not.toHaveClass(/open/);
    const section = page.locator("section#services");
    await expect(section).toBeInViewport();
  });
});
