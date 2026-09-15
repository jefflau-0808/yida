"use client";

import { Bookmark, Check, ChevronLeft, RefreshCw, Sparkles } from "lucide-react";
import type { GarmentView, OutfitRecommendation, RecommendationItem, Scene } from "@/lib/domain/types";
import { SCENE_LABELS } from "@/lib/domain/types";
import { Button, Notice, Spinner } from "./ui";

function fallbackImage(item: RecommendationItem, variant: number) {
  if (item.category === "shoes") return "/demo/sneakers.webp";
  return variant % 2 === 0 ? "/demo/jeans.jpg" : "/demo/blue-jeans.jpg";
}

function matchedGarment(garments: GarmentView[], item: RecommendationItem) {
  return item.candidateId ? garments.find((garment) => garment.id === item.candidateId) : undefined;
}

function ItemCard({
  item,
  garments,
  variant,
  onAddSimilar,
}: {
  item: RecommendationItem;
  garments: GarmentView[];
  variant: number;
  onAddSimilar: (category: "bottom" | "shoes") => void;
}) {
  const matched = matchedGarment(garments, item);
  const matchLabel = item.match === "owned"
    ? "衣柜已有"
    : item.match === "similar"
      ? "衣柜有相似款"
      : "AI 搭配参考";
  const imageUrl = matched?.imageUrl ?? fallbackImage(item, variant);

  return (
    <article className="recommend-card">
      <div className="recommend-card__image">
        <img src={imageUrl} alt={`${item.color}${item.name}`} />
        <span className={`source-tag source-tag--${item.match}`}>
          {item.match === "owned" ? <Check size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          {matchLabel}
        </span>
      </div>
      <div className="recommend-card__body">
        <p>{item.category === "bottom" ? "裤装建议" : "鞋款建议"}</p>
        <h3>{matched?.name ?? item.name}</h3>
        <small>{item.color} · {item.fit} · {item.pattern}</small>
        {item.match === "similar" ? <em>版型或颜色接近，建议按实际衣物替代。</em> : null}
        {item.match === "reference" ? (
          <button className="text-link" type="button" onClick={() => onAddSimilar(item.category as "bottom" | "shoes")}>我找到相似款，收录到衣柜 →</button>
        ) : null}
      </div>
    </article>
  );
}

export function OutfitScreen({
  top,
  garments,
  scene,
  recommendation,
  recommending,
  imageStatus,
  error,
  saved,
  onSceneChange,
  onRecommend,
  onAnother,
  onFavorite,
  onBack,
  onAddSimilar,
}: {
  top: GarmentView;
  garments: GarmentView[];
  scene: Scene;
  recommendation?: OutfitRecommendation;
  recommending: boolean;
  imageStatus?: "queued" | "running" | "succeeded" | "failed";
  error?: string;
  saved: boolean;
  onSceneChange: (scene: Scene) => void;
  onRecommend: () => void;
  onAnother: () => void;
  onFavorite: () => void;
  onBack: () => void;
  onAddSimilar: (category: "bottom" | "shoes") => void;
}) {
  const bottomImage = recommendation
    ? matchedGarment(garments, recommendation.bottom)?.imageUrl ?? fallbackImage(recommendation.bottom, recommendation.variant)
    : "/demo/jeans.jpg";
  const shoesImage = recommendation
    ? matchedGarment(garments, recommendation.shoes)?.imageUrl ?? "/demo/sneakers.webp"
    : "/demo/sneakers.webp";

  return (
    <section className="page-wrap result-page">
      <button className="back-link" type="button" onClick={onBack}><ChevronLeft size={18} /> 重新选一件</button>

      <div className="result-intro">
        <div>
          <p className="eyebrow">A LITTLE INSPIRATION FOR YOU</p>
          <h1>{recommendation?.title ?? "先告诉我，今天要去哪里？"}</h1>
        </div>
        <label className="scene-field">
          今天要去哪里？
          <select value={scene} onChange={(event) => onSceneChange(event.target.value as Scene)}>
            {Object.entries(SCENE_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="top-context">
        <img src={top.imageUrl} alt={top.name} />
        <div><p>本次起点</p><h2>{top.name}</h2><small>{top.color} · {top.fit} · {top.pattern}</small></div>
        <span><Check size={16} /> {top.origin === "user" ? "已在衣柜" : "示例衣物，不会入库"}</span>
      </div>

      {!recommendation ? (
        <div className="start-recommendation">
          <div className="start-recommendation__visual">
            <img src={top.imageUrl} alt="" />
            <span>＋</span><div className="placeholder-garment">裤装</div><span>＋</span><div className="placeholder-garment">鞋子</div>
          </div>
          <h2>从这件上衣出发，完成整套搭配</h2>
          <p>当前为模拟 AI：用于验证完整界面、衣柜匹配与操作流程，不代表真实模型效果。</p>
          {error ? <Notice tone="warning">{error}</Notice> : null}
          <Button onClick={onRecommend} disabled={recommending}>
            {recommending ? <Spinner label="正在生成文字建议" /> : <><Sparkles size={18} /> 生成搭配</>}
          </Button>
        </div>
      ) : (
        <>
          {error ? <Notice tone="warning">{error}</Notice> : null}
          <div className="result-grid">
            <figure className="outfit-board">
              <figcaption>
                <span>整套搭配示意</span>
                <strong>{imageStatus === "succeeded" ? "模拟组合已就绪" : imageStatus === "failed" ? "示意加载失败" : "正在组合"}</strong>
              </figcaption>
              <div className="outfit-board__canvas" data-testid="outfit-visual">
                <div className="board-label board-label--top">01 / 上衣</div>
                <img className="board-top" src={top.imageUrl} alt={`上衣：${top.name}`} />
                <div className="board-label board-label--bottom">02 / 裤装</div>
                <img className="board-bottom" src={bottomImage} alt={`裤子：${recommendation.bottom.name}`} />
                <div className="board-label board-label--shoes">03 / 鞋子</div>
                <img className="board-shoes" src={shoesImage} alt={`鞋子：${recommendation.shoes.name}`} />
                <span className="board-dot" aria-hidden="true" />
              </div>
              <p><Sparkles size={15} aria-hidden="true" /> 模拟整套搭配示意，非实物商品或试穿保证。</p>
            </figure>

            <aside className="outfit-copy">
              <p className="eyebrow">WHY IT WORKS</p>
              <h2>搭配思路</h2>
              <p>{recommendation.reason}</p>
              <div className="styling-tip"><strong>穿法小提示</strong><span>{recommendation.tip}</span></div>
              <p className="mock-badge">模拟 AI 推荐 · 数据仅用于产品体验</p>
            </aside>
          </div>

          <div className="recommendation-list">
            <ItemCard item={recommendation.bottom} garments={garments} variant={recommendation.variant} onAddSimilar={onAddSimilar} />
            <ItemCard item={recommendation.shoes} garments={garments} variant={recommendation.variant} onAddSimilar={onAddSimilar} />
          </div>

          <div className="result-actions">
            <Button tone="secondary" onClick={onAnother} disabled={recommending}>
              <RefreshCw size={18} /> {recommending ? "正在换一套" : "换一套"}
            </Button>
            <Button onClick={onFavorite} disabled={saved}>
              <Bookmark size={18} /> {saved ? "已收藏" : "收藏这套"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
