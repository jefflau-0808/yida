"use client";

import { Pencil, Plus, Shirt, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { GarmentCategory, GarmentView } from "@/lib/domain/types";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import { Button } from "./ui";

type Filter = "all" | GarmentCategory;

export function WardrobeScreen({
  garments,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onPair,
  onClear,
}: {
  garments: GarmentView[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (garment: GarmentView) => void;
  onDelete: (garment: GarmentView) => void;
  onPair: (garment: GarmentView) => void;
  onClear: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(
    () => garments.filter((item) => filter === "all" || item.category === filter),
    [filter, garments],
  );

  return (
    <section className="page-wrap content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR REAL CLOSET</p>
          <h1>我的衣柜</h1>
          <p>只收录你确认过的真实衣物。拍过一次，下次直接选择。</p>
        </div>
        <Button onClick={onAdd}><Plus size={18} aria-hidden="true" /> 收录一件</Button>
      </div>

      <div className="filter-row" aria-label="衣物筛选">
        {(["all", "top", "bottom", "shoes"] as const).map((key) => (
          <button className={filter === key ? "is-active" : ""} key={key} onClick={() => setFilter(key)} type="button">
            {key === "all" ? `全部 ${garments.length}` : CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      {loading ? <p className="empty-state">正在打开本地衣柜…</p> : null}
      {!loading && visible.length === 0 ? (
        <div className="empty-state empty-state--large">
          <Shirt size={34} aria-hidden="true" />
          <h2>{garments.length ? "这个分类还没有衣物" : "衣柜还是空的"}</h2>
          <p>不必先录入裤子和鞋子。从今天想穿的那件上衣开始就好。</p>
          <Button onClick={onAdd}>拍一件衣物</Button>
        </div>
      ) : null}

      <div className="wardrobe-grid">
        {visible.map((garment) => (
          <article className="garment-card" key={garment.id}>
            <div className="garment-card__image">
              <img src={garment.imageUrl} alt={garment.name} />
              <span>真实衣物</span>
            </div>
            <div className="garment-card__body">
              <p>{CATEGORY_LABELS[garment.category]}</p>
              <h2>{garment.name}</h2>
              <small>{garment.color} · {garment.fit} · {garment.pattern}</small>
              <div className="garment-card__actions">
                {garment.category === "top" ? (
                  <Button onClick={() => onPair(garment)}><Sparkles size={16} aria-hidden="true" /> 开始搭配</Button>
                ) : null}
                <button aria-label={`编辑 ${garment.name}`} onClick={() => onEdit(garment)} type="button"><Pencil size={17} /></button>
                <button aria-label={`删除 ${garment.name}`} onClick={() => onDelete(garment)} type="button"><Trash2 size={17} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {garments.length ? (
        <div className="data-footer">
          <p>这些照片只保存在当前浏览器，清除浏览器数据可能丢失。</p>
          <button className="danger-link" onClick={onClear} type="button">清空衣柜与收藏</button>
        </div>
      ) : null}
    </section>
  );
}
