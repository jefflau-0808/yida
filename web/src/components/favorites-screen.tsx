"use client";

import { Heart, Trash2 } from "lucide-react";
import type { FavoriteView } from "@/hooks/use-local-data";
import { SCENE_LABELS } from "@/lib/domain/types";

export function FavoritesScreen({
  favorites,
  onRemove,
}: {
  favorites: FavoriteView[];
  onRemove: (id: string) => void;
}) {
  return (
    <section className="page-wrap content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SAVED FOR LATER</p>
          <h1>收藏搭配</h1>
          <p>保留当时的方案与理由，之后再回来找灵感。</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state empty-state--large">
          <Heart size={34} aria-hidden="true" />
          <h2>还没有收藏</h2>
          <p>看到喜欢的搭配时，点一下“收藏这套”。</p>
        </div>
      ) : (
        <div className="favorite-grid">
          {favorites.map((favorite) => (
            <article className="favorite-card" key={favorite.id}>
              <div className="favorite-card__visual">
                {favorite.topImageUrl ? <img src={favorite.topImageUrl} alt={favorite.snapshot.top.name} /> : <div className="image-missing">照片已从衣柜移除</div>}
                <div>
                  <span>{favorite.snapshot.bottom.color}<br />{favorite.snapshot.bottom.type}</span>
                  <span>{favorite.snapshot.shoes.color}<br />{favorite.snapshot.shoes.type}</span>
                </div>
              </div>
              <div className="favorite-card__body">
                <p>{SCENE_LABELS[favorite.snapshot.scene]}</p>
                <h2>{favorite.snapshot.title}</h2>
                <small>{favorite.snapshot.reason}</small>
                <button aria-label="移除收藏" onClick={() => onRemove(favorite.id)} type="button"><Trash2 size={17} /> 移除</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="local-footnote">仅保存在当前浏览器，暂不支持跨设备同步。</p>
    </section>
  );
}
