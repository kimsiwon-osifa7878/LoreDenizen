import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const screenshotsDir = path.join(process.cwd(), "docs", "screenshots");

test.beforeEach(async () => {
  await fs.mkdir(screenshotsDir, { recursive: true });
});

test("새 대화 시작 시 캐릭터 선택 모달이 표시된다", async ({ page }) => {
  await page.goto("/");

  const newChatButton = page.getByRole("button", {
    name: /new chat|새 대화/i,
  });
  await expect(newChatButton).toBeVisible();
  await newChatButton.click();

  await expect(
    page.getByRole("heading", { name: /choose a character|캐릭터 선택/i })
  ).toBeVisible();

  await page.screenshot({
    path: path.join(screenshotsDir, "character-picker-dialog.png"),
    fullPage: true,
  });
});

test("사이드바 대화 목록/캐릭터 목록이 렌더링된다", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText(/no conversations yet|대화가 없습니다/i)
  ).toBeVisible();
  await expect(page.getByText(/characters|캐릭터/i)).toBeVisible();
});

test("캐릭터 선택 후 First Message가 대화에 먼저 표시된다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /new chat|새 대화/i }).click();
  await page.getByRole("button", { name: /select|선택/i }).first().click();

  await expect(page.getByText(/The steady crackle of the fireplace/i)).toBeVisible();

  await page.screenshot({
    path: path.join(screenshotsDir, "first-message-seeded.png"),
    fullPage: true,
  });
});

test("OpenRouter API key 검증 실패 시 모델이 선택되지 않는다", async ({ page }) => {
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "prompt") {
      await dialog.accept("invalid-api-key");
      return;
    }
    await dialog.accept();
  });

  await page.route("**/api/openrouter/models**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "openai/gpt-4o-mini",
            name: "GPT-4o mini",
            contextLength: 128000,
            promptPrice: 0.000001,
            completionPrice: 0.000002,
            created: 1714608000,
          },
        ],
        hasMore: false,
      }),
    });
  });

  await page.route("**/api/openrouter/config", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ hasApiKey: false }),
    });
  });

  await page.route("**/api/openrouter/validate", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        valid: false,
        error: "Invalid API key",
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /^settings$|^설정$/i }).click();
  await page.getByRole("button", { name: "OpenRouter" }).click();
  await page.getByRole("button", { name: /select|선택/i }).last().click();

  await expect(page.getByText(/openrouter::openai\/gpt-4o-mini/i)).toHaveCount(0);

  await page.screenshot({
    path: path.join(screenshotsDir, "openrouter-invalid-key.png"),
    fullPage: true,
  });
});
