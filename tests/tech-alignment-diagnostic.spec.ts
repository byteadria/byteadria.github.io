import { test, expect } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

for (const vp of viewports) {
  test(`tech item centering at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const stackSection = page.locator("#stack");
    await stackSection.scrollIntoViewIfNeeded();
    // Wait for reveal animations
    await page.waitForTimeout(1000);

    const diagnostics = await page.evaluate(() => {
      const grid = document.querySelector("#stack [data-reveal-stagger]");
      if (!grid) return { error: "grid not found" };

      const gridRect = grid.getBoundingClientRect();
      const cards = grid.querySelectorAll(":scope > div");
      const results: any[] = [];

      for (const card of cards) {
        const cardRect = card.getBoundingClientRect();
        const nameEl = card.querySelector("span:first-child");
        const subtitleEl = card.querySelector("span:last-child");
        const textBlock = nameEl?.parentElement;
        const iconContainer = card.querySelector("div:first-child");

        if (!nameEl || !subtitleEl || !textBlock || !iconContainer) continue;

        const nameRect = nameEl.getBoundingClientRect();
        const subtitleRect = subtitleEl.getBoundingClientRect();
        const textBlockRect = textBlock.getBoundingClientRect();
        const iconRect = iconContainer.getBoundingClientRect();

        const cardCenterX = cardRect.left + cardRect.width / 2;
        const iconCenterX = iconRect.left + iconRect.width / 2;
        const textBlockCenterX = textBlockRect.left + textBlockRect.width / 2;
        const nameCenterX = nameRect.left + nameRect.width / 2;
        const subtitleCenterX = subtitleRect.left + subtitleRect.width / 2;

        results.push({
          name: nameEl.textContent?.trim(),
          cardWidth: Math.round(cardRect.width),
          cardLeft: Math.round(cardRect.left),
          cardCenterX: Math.round(cardCenterX),
          iconWidth: Math.round(iconRect.width),
          iconCenterX: Math.round(iconCenterX),
          iconOffsetFromCardCenter: Math.round(iconCenterX - cardCenterX),
          textBlockWidth: Math.round(textBlockRect.width),
          textBlockCenterX: Math.round(textBlockCenterX),
          textBlockOffsetFromCardCenter: Math.round(textBlockCenterX - cardCenterX),
          nameWidth: Math.round(nameRect.width),
          nameCenterX: Math.round(nameCenterX),
          nameOffsetFromCardCenter: Math.round(nameCenterX - cardCenterX),
          subtitleWidth: Math.round(subtitleRect.width),
          subtitleCenterX: Math.round(subtitleCenterX),
          subtitleOffsetFromCardCenter: Math.round(subtitleCenterX - cardCenterX),
          nameOffsetFromIcon: Math.round(nameCenterX - iconCenterX),
          subtitleOffsetFromIcon: Math.round(subtitleCenterX - iconCenterX),
        });
      }

      return {
        viewportWidth: window.innerWidth,
        gridWidth: Math.round(gridRect.width),
        gridLeft: Math.round(gridRect.left),
        gridRight: Math.round(gridRect.right),
        gridCenterX: Math.round(gridRect.left + gridRect.width / 2),
        cards,
        items: results,
      };
    });

    console.log(`\n=== ${vp.width}px viewport ===`);
    console.log(JSON.stringify(diagnostics, null, 2));

    // Basic sanity: each item's card center should align with its icon and text centers
    if (diagnostics.items) {
      for (const item of diagnostics.items) {
        console.log(
          `\n${item.name}: card=${item.cardWidth}px, icon=${item.iconWidth}px, text=${item.textBlockWidth}px`
        );
        console.log(
          `  icon offset from card center: ${item.iconOffsetFromCardCenter}px`
        );
        console.log(
          `  text offset from card center: ${item.textBlockOffsetFromCardCenter}px`
        );
        console.log(
          `  name offset from icon center: ${item.nameOffsetFromIcon}px`
        );
      }
    }

    expect(diagnostics.error).toBeUndefined();
  });
}
