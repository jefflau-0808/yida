import { expect, test } from "@playwright/test";

test("示例上衣可完成推荐、整套示意和收藏流程", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /从一件上衣开始/ })).toBeVisible();
  await page.getByRole("button", { name: /先用示例体验完整流程/ }).click();
  await expect(page.getByRole("heading", { name: /先告诉我/ })).toBeVisible();
  await page.getByRole("button", { name: "生成搭配" }).click();
  await expect(page.getByRole("heading", { name: "松弛有型，刚刚好。" })).toBeVisible();
  const visual = page.getByTestId("outfit-visual");
  await expect(visual).toBeVisible();
  await expect(visual.getByRole("img")).toHaveCount(3);
  await expect(page.getByText("模拟整套搭配示意，非实物商品或试穿保证。")).toBeVisible();
  await page.getByRole("button", { name: "收藏这套" }).click();
  await expect(page.getByRole("button", { name: "已收藏" })).toBeVisible();
});

test("手机宽度没有横向溢出，底部导航可用", async ({ page, isMobile }) => {
  test.skip(!isMobile, "仅在手机项目执行");
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "手机导航" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.getByRole("button", { name: "衣柜", exact: true }).click();
  await expect(page.getByRole("heading", { name: "我的衣柜" })).toBeVisible();
});
