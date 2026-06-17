import { test, expect } from "@playwright/test";

test.describe("Navbar", () => {
  test("navbar is visible and fully clickable", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();

    const links = nav.locator("a[data-nav-link]");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      await links.nth(i).click({ force: false });
      await expect(links.nth(i)).toBeVisible();
    }
  });

  test("no invisible overlay blocks navbar interactions", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator('nav[aria-label="Main navigation"]');
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();

    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    const hit = await page.evaluate(({ x, y }: { x: number; y: number }) => {
      // Temporarily disable pointer-events to find what would be clicked
      const el = document.elementFromPoint(x, y);
      if (!el) return "none";
      return el.closest("nav") ? "nav" : el.tagName;
    }, { x: centerX, y: centerY });
    expect(hit).toBe("nav");
  });

  test("nav CTA button is clickable", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator('nav a:has-text("Start a project")');
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });
});

test.describe("Navigation links resolve correctly", () => {
  test("all section anchors exist", async ({ page }) => {
    await page.goto("/");

    const sections = ["work", "services", "stack", "about", "contact"];
    for (const id of sections) {
      const section = page.locator(`#${id}`);
      await expect(section).toBeAttached();
    }
  });

  test("nav links scroll to correct sections", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const nav = page.locator('nav[aria-label="Main navigation"]');

    const testCases = [
      { text: "Work", id: "work" },
      { text: "Services", id: "services" },
      { text: "Stack", id: "stack" },
      { text: "About", id: "about" },
      { text: "Contact", id: "contact" },
    ];

    for (const { text, id } of testCases) {
      const link = nav.locator(`a:has-text("${text}")`);
      await link.click();
      await page.waitForTimeout(500);
      const section = page.locator(`#${id}`);
      await expect(section).toBeInViewport();
    }
  });
});

test.describe("No broken social icons", () => {
  test("no twitter/x icon exists in the DOM", async ({ page }) => {
    await page.goto("/");
    const twitterLinks = page.locator('a[aria-label="Twitter / X"]');
    await expect(twitterLinks).toHaveCount(0);
  });

  test("footer social links have hrefs", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const socialLinks = footer.locator('a[target="_blank"]');
    const count = await socialLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await socialLinks.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("");
      expect(href).not.toBe("#");
    }
  });
});

test.describe("Cursor and interaction stability", () => {
  test("hovering cards does not cause layout shift", async ({ page }) => {
    await page.goto("/");

    const cards = page.locator("[data-tilt]");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      const boxBefore = await card.boundingBox();

      await card.hover({ force: true });
      await page.waitForTimeout(100);

      const boxAfter = await card.boundingBox();

      expect(boxAfter).not.toBeNull();
      expect(boxBefore).not.toBeNull();
      expect(Math.abs(boxAfter!.width - boxBefore!.width)).toBeLessThan(0.5);
      expect(Math.abs(boxAfter!.height - boxBefore!.height)).toBeLessThan(0.5);
    }
  });

  test("cursor is pointer on clickable elements", async ({ page }) => {
    await page.goto("/");

    const clickables = [
      page.locator('nav a[data-nav-link]').first(),
      page.locator('nav a:has-text("Start a project")'),
      page.locator('a:has-text("View on Upwork")').first(),
    ];

    for (const el of clickables) {
      await expect(el).toBeVisible();
      const cursor = await el.evaluate((el) => getComputedStyle(el).cursor);
      expect(cursor).toBe("pointer");
    }
  });
});

test.describe("Accessibility", () => {
  test("no empty links in navigation", async ({ page }) => {
    await page.goto("/");
    const links = page.locator('nav a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      const text = await links.nth(i).textContent();
      expect(href).toBeTruthy();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test("nav has accessible aria-label", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
  });

  test("skip link is present", async ({ page }) => {
    await page.goto("/");
    const skip = page.locator(".skip-link");
    await expect(skip).toBeVisible();
    await expect(skip).toHaveText("Skip to content");
  });
});
