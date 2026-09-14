import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 390, 768, 1440]) {
  test(`layout and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() =>
        [...document.fonts].every((font) => font.status === "loaded"),
      ),
    ).toBe(true);
    expect(
      await page
        .locator("h1")
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBeGreaterThan(50);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "TobiasSeeanner.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images.every((img) => img.complete && img.naturalWidth > 0),
        ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(errors).toEqual([]);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `/tmp/portfolio-${width}.png`,
        fullPage: true,
      });
  });
}

test("filters select experience and details are keyboard accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Research", exact: true }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(1);
  await expect(page.locator(".project-card:visible")).toContainText("LocalRES");
  await page.locator('[data-project="localres"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("JUN — NOV 2024");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator('[data-project="localres"]')).toBeFocused();
  await page.getByRole("button", { name: "Industry", exact: true }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(1);
  await page.locator('[data-project="bmw"]').click();
  await expect(page.getByRole("dialog")).toContainText("BMW Group");
  await page.getByRole("button", { name: "Close experience details" }).click();
  await page.getByRole("button", { name: "All 02" }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(2);
});

test("phone navigation and internal links work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  await expect(page.locator("#navigation")).toBeVisible();
  await page.locator('#navigation a[href="#community"]').click();
  await expect(page).toHaveURL(/#community$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const invalid = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links.filter((a) => !document.querySelector(a.hash)).map((a) => a.hash),
    );
  expect(invalid).toEqual([]);
  await expect(
    page.locator('a[href="mailto:tobias.seeanner@gmail.com"]').first(),
  ).toBeVisible();
});
