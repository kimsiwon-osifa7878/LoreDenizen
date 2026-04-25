import { expect, test } from "@playwright/test";

test("새 대화 시작 시 캐릭터 선택 모달이 표시된다", async ({ page }) => {
  await page.goto("/");

  const newChatButton = page.getByRole("button", {
    name: /new chat|새 대화/i,
  });
  await expect(newChatButton).toBeVisible();
  await newChatButton.click();

  await expect(
    page.getByText(/choose a character|캐릭터 선택/i)
  ).toBeVisible();
});

test("사이드바 대화 목록/캐릭터 목록이 렌더링된다", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText(/no conversations yet|대화가 없습니다/i)
  ).toBeVisible();
  await expect(page.getByText(/characters|캐릭터/i)).toBeVisible();
});
