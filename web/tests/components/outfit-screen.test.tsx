import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OutfitScreen } from "@/components/outfit-screen";
import { SAMPLE_TOP } from "@/lib/domain/samples";
import type { OutfitRecommendation } from "@/lib/domain/types";

const recommendation: OutfitRecommendation = {
  id: "outfit-1",
  title: "松弛有型，刚刚好。",
  scene: "daily",
  top: SAMPLE_TOP,
  bottom: { name: "深蓝直筒牛仔裤", category: "bottom", type: "牛仔裤", color: "深蓝色", pattern: "纯色", fit: "直筒", match: "reference" },
  shoes: { name: "米白低帮运动鞋", category: "shoes", type: "运动鞋", color: "米白色", pattern: "拼色", fit: "低帮", match: "reference" },
  reason: "深浅有层次，轮廓保持平衡。",
  tip: "裤脚落在鞋面附近。",
  mock: true,
  variant: 0,
};

describe("搭配结果", () => {
  it("结果区始终显示上衣、裤子和鞋子三部分，避免空白页", () => {
    render(
      <OutfitScreen
        top={SAMPLE_TOP} garments={[]} scene="daily" recommendation={recommendation} recommending={false}
        imageStatus="succeeded" saved={false} onSceneChange={vi.fn()} onRecommend={vi.fn()} onAnother={vi.fn()}
        onFavorite={vi.fn()} onBack={vi.fn()} onAddSimilar={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: /上衣：/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /裤子：/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /鞋子：/ })).toBeInTheDocument();
    expect(screen.getByTestId("outfit-visual")).toBeInTheDocument();
    expect(screen.getByText("模拟整套搭配示意，非实物商品或试穿保证。")).toBeInTheDocument();
  });

  it("未匹配的参考款不会显示衣柜已有", () => {
    render(
      <OutfitScreen
        top={SAMPLE_TOP} garments={[]} scene="daily" recommendation={recommendation} recommending={false}
        imageStatus="running" saved={false} onSceneChange={vi.fn()} onRecommend={vi.fn()} onAnother={vi.fn()}
        onFavorite={vi.fn()} onBack={vi.fn()} onAddSimilar={vi.fn()}
      />,
    );
    expect(screen.getAllByText("AI 搭配参考")).toHaveLength(2);
    expect(screen.queryByText("衣柜已有")).not.toBeInTheDocument();
  });
});
