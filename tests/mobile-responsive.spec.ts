import { test, expect } from "@playwright/test";

const mobileViewports = [
  { width: 320, height: 568, name: "320x568" },
  { width: 360, height: 800, name: "360x800" },
  { width: 375, height: 812, name: "375x812" },
  { width: 390, height: 844, name: "390x844" },
  { width: 412, height: 915, name: "412x915" },
  { width: 430, height: 932, name: "430x932" },
];

const tabletViewport = { width: 768, height: 1024, name: "768x1024" };
const desktopViewport = { width: 1440, height: 900, name: "1440x900" };

function isDecorativeElement(el: Element): boolean {
  const cls = el.className && typeof el.className === "string" ? el.className : "";
  if (cls.includes("animate-drift")) return true;
  if (cls.includes("bg-grid") || cls.includes("bg-noise") || cls.includes("bg-gradient-section")) return true;
  if (cls.includes("pointer-events-none") && cls.includes("fixed")) return true;
  const parent = el.parentElement;
  if (parent) {
    const parentCls = parent.className && typeof parent.className === "string" ? parent.className : "";
    if (parentCls.includes("pointer-events-none") && (parentCls.includes("absolute") || parentCls.includes("inset-0"))) return true;
  }
  return false;
}

for (const vp of mobileViewports) {
  test.describe(`Mobile ${vp.name}`, () => {
    test(`no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
        };
      });

      expect(overflow.hasHorizontalScroll).toBe(false);
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    });

    test(`no content elements extend past viewport right edge`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const overflows = await page.evaluate((vpWidth) => {
        const results: string[] = [];
        const contentElements = document.querySelectorAll(
          "section > .section-container, section > div > .section-container, nav, footer, #contact-form, #form-submit, .case-study-toggle, [data-cmd-item]"
        );
        for (const el of contentElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > vpWidth + 2 && rect.width > 0) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls =
              el.className && typeof el.className === "string"
                ? el.className.split(" ").slice(0, 3).join(".")
                : "";
            results.push(`${tag}${id}.${cls}: right=${Math.round(rect.right)} (overflow by ${Math.round(rect.right - vpWidth)}px)`);
          }
        }
        return results;
      }, vp.width);

      if (overflows.length > 0) {
        console.log(`Content elements extending past viewport at ${vp.name}:`, overflows);
      }
      expect(overflows.length).toBe(0);
    });

    test(`no content elements extend past viewport left edge`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const overflows = await page.evaluate(() => {
        const results: string[] = [];
        const contentElements = document.querySelectorAll(
          "section > .section-container, section > div > .section-container, nav, footer, #contact-form, #form-submit, .case-study-toggle, [data-cmd-item]"
        );
        for (const el of contentElements) {
          const rect = el.getBoundingClientRect();
          if (rect.left < -2 && rect.width > 0) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            results.push(`${tag}${id}: left=${Math.round(rect.left)}`);
          }
        }
        return results;
      });

      if (overflows.length > 0) {
        console.log(`Content elements extending past left edge at ${vp.name}:`, overflows);
      }
      expect(overflows.length).toBe(0);
    });

    test(`"Send Message" button is fully visible`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const btn = page.locator("#form-submit");
      await btn.scrollIntoViewIfNeeded();

      const box = await btn.boundingBox();
      expect(box).not.toBeNull();

      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 2);
        expect(box.y).toBeGreaterThanOrEqual(0);
      }
    });

    test(`tech stack card text is centered relative to each card`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const stackSection = page.locator("#stack");
      await stackSection.scrollIntoViewIfNeeded();

      const offsets = await page.evaluate(() => {
        const grid = document.querySelector("#stack [data-reveal-stagger]");
        if (!grid) return { error: "grid not found" };

        const results: Array<{
          name: string;
          cardCenterX: number;
          textBlockOffset: number;
          nameOffset: number;
          subtitleOffset: number;
          overflow: boolean;
        }> = [];
        const cards = grid.querySelectorAll(":scope > div");

        for (const card of cards) {
          const cardRect = card.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;
          const nameEl = card.querySelector("span:first-child");
          const subtitleEl = card.querySelector("span:last-child");
          const textBlock = nameEl && nameEl.parentElement;
          if (!nameEl || !subtitleEl || !textBlock) continue;

          const center = (el: Element) => {
            const r = el.getBoundingClientRect();
            return r.left + r.width / 2;
          };

          const textBlockRect = textBlock.getBoundingClientRect();
          results.push({
            name: nameEl.textContent?.trim() || "",
            cardCenterX,
            textBlockOffset: Math.round((center(textBlock) - cardCenterX) * 10) / 10,
            nameOffset: Math.round((center(nameEl) - cardCenterX) * 10) / 10,
            subtitleOffset: Math.round((center(subtitleEl) - cardCenterX) * 10) / 10,
            overflow: textBlockRect.right > cardRect.right + 1 || textBlockRect.left < cardRect.left - 1,
          });
        }
        return results;
      });

      expect(offsets.error).toBeUndefined();
      expect(offsets.length).toBeGreaterThan(0);
      for (const item of offsets) {
        expect(Math.abs(item.textBlockOffset), `${item.name}: text block not centered`).toBeLessThanOrEqual(2);
        expect(Math.abs(item.nameOffset), `${item.name}: name not centered`).toBeLessThanOrEqual(2);
        expect(Math.abs(item.subtitleOffset), `${item.name}: subtitle not centered`).toBeLessThanOrEqual(2);
        expect(item.overflow, `${item.name}: text overflows card`).toBe(false);
      }
    });
  });
}

test.describe("Desktop regression", () => {
  test(`no horizontal overflow at ${desktopViewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: desktopViewport.width, height: desktopViewport.height });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
      };
    });

    expect(overflow.hasHorizontalScroll).toBe(false);
  });

  test("Send Message button is fully visible at desktop", async ({ page }) => {
    await page.setViewportSize({ width: desktopViewport.width, height: desktopViewport.height });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const btn = page.locator("#form-submit");
    await btn.scrollIntoViewIfNeeded();
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(desktopViewport.width + 2);
    }
  });
});

test.describe("Tablet regression", () => {
  test(`no horizontal overflow at ${tabletViewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: tabletViewport.width, height: tabletViewport.height });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
      };
    });

    expect(overflow.hasHorizontalScroll).toBe(false);
  });
});
