import { test, expect } from "@playwright/test";

test.describe("Navbar links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders all five nav links", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');
    await expect(links).toHaveCount(5);
  });

  test("each link has a valid #href", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toMatch(/^#/);
      expect(href!.length).toBeGreaterThan(1);
    }
  });

  test("every #href target section exists in the DOM", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      const id = href!.replace("#", "");
      const section = page.locator(`section#${id}`);
      await expect(section).toBeAttached();
    }
  });

  test("each link has cursor:pointer", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');

    for (const link of await links.all()) {
      const cursor = await link.evaluate((el) => getComputedStyle(el).cursor);
      expect(cursor).toBe("pointer");
    }
  });

  test("each link has ::after pseudo-element with transition on hover", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');

    for (const link of await links.all()) {
      const transitionProp = await link.evaluate((el) => {
        const after = getComputedStyle(el, "::after");
        // Check that the ::after has a width transition (underline animation)
        return after.transitionProperty;
      });
      expect(transitionProp).toContain("width");
    }
  });

  test("all links have identical font-size and padding", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const firstFontSize = await links.nth(0).evaluate((el) => getComputedStyle(el).fontSize);
    const firstFontWeight = await links.nth(0).evaluate((el) => getComputedStyle(el).fontWeight);

    for (let i = 1; i < count; i++) {
      const fontSize = await links.nth(i).evaluate((el) => getComputedStyle(el).fontSize);
      const fontWeight = await links.nth(i).evaluate((el) => getComputedStyle(el).fontWeight);
      expect(fontSize).toBe(firstFontSize);
      expect(fontWeight).toBe(firstFontWeight);
    }
  });
});

test.describe("Anchor scroll behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
  });

  test("clicking each nav link scrolls to the correct section", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute("href");
      const id = href!.replace("#", "");

      await link.click();
      await page.waitForTimeout(600);

      const section = page.locator(`section#${id}`);
      await expect(section).toBeInViewport();
    }
  });
});

test.describe("Cursor consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("no text cursor on nav link hover", async ({ page }) => {
    const links = page.locator('nav[aria-label="Main navigation"] a[data-nav-link]');

    for (const link of await links.all()) {
      await link.hover();
      const cursor = await link.evaluate((el) => getComputedStyle(el).cursor);
      expect(cursor).toBe("pointer");
    }
  });
});

test.describe("No orphaned social icons", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Twitter/X icon is absent from the DOM", async ({ page }) => {
    await expect(page.locator('a[aria-label="Twitter / X"]')).toHaveCount(0);
    await expect(page.locator('a[href*="x.com"]')).toHaveCount(0);
    await expect(page.locator('a[href*="twitter.com"]')).toHaveCount(0);
  });
});
