import type { RecommendRequest } from "@/lib/api-contracts";

const options = [
  {
    title: "松弛有型，刚刚好。",
    bottom: {
      category: "bottom" as const,
      type: "牛仔裤",
      color: "深蓝色",
      pattern: "纯色",
      fit: "直筒",
      name: "深蓝直筒牛仔裤",
    },
    shoes: {
      category: "shoes" as const,
      type: "运动鞋",
      color: "米白色",
      pattern: "拼色",
      fit: "低帮",
      name: "米白低帮运动鞋",
    },
  },
  {
    title: "收一点轮廓，换一种感觉。",
    bottom: {
      category: "bottom" as const,
      type: "牛仔裤",
      color: "蓝色",
      pattern: "纯色",
      fit: "锥形",
      name: "蓝色锥形牛仔裤",
    },
    shoes: {
      category: "shoes" as const,
      type: "运动鞋",
      color: "米白色",
      pattern: "拼色",
      fit: "低帮",
      name: "米白低帮运动鞋",
    },
  },
  {
    title: "干净利落，也保留轻松感。",
    bottom: {
      category: "bottom" as const,
      type: "西裤",
      color: "灰色",
      pattern: "纯色",
      fit: "直筒",
      name: "灰色直筒西裤",
    },
    shoes: {
      category: "shoes" as const,
      type: "运动鞋",
      color: "白色",
      pattern: "纯色",
      fit: "低帮",
      name: "白色低帮运动鞋",
    },
  },
];

function candidateId(
  request: RecommendRequest,
  item: (typeof options)[number]["bottom"] | (typeof options)[number]["shoes"],
): string | undefined {
  return request.candidates.find(
    (candidate) =>
      candidate.category === item.category &&
      candidate.type === item.type &&
      candidate.color === item.color &&
      candidate.fit === item.fit,
  )?.id;
}

export async function mockRecommend(request: RecommendRequest) {
  const index = request.previousKeys.length % options.length;
  const option = options[index];
  const sceneTip = {
    daily: "裤脚落在鞋面附近，整体会更利落。",
    work: "适合着装要求宽松的工作日；正式场合请换更正式的鞋裤。",
    date: "上衣前摆轻轻收进裤腰，保留自然的松弛感。",
  }[request.scene];
  await new Promise((resolve) => setTimeout(resolve, 220));
  return {
    id: crypto.randomUUID(),
    title: option.title,
    bottom: { ...option.bottom, candidateId: candidateId(request, option.bottom) },
    shoes: { ...option.shoes, candidateId: candidateId(request, option.shoes) },
    reason: `${request.top.color}${request.top.type}搭配${option.bottom.color}${option.bottom.fit}${option.bottom.type}，上下形成清楚的深浅层次；${option.shoes.color}${option.shoes.type}让整体保持轻快。`,
    tip: sceneTip,
    mock: true,
    variant: index,
  };
}

export async function analyzeMockGarment() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  return {
    category: "top" as const,
    type: "T 恤",
    color: "白色",
    pattern: "纯色",
    fit: "宽松",
    mock: true,
    notice: "当前使用模拟识别，请按照片手动确认标签。",
  };
}
