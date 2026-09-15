"use client";

import { Heart, Plus, Shirt } from "lucide-react";
import type { ReactNode } from "react";

export type AppView = "home" | "wardrobe" | "favorites" | "outfit";

export function AppShell({
  view,
  wardrobeCount,
  favoriteCount,
  onNavigate,
  onAdd,
  children,
}: {
  view: AppView;
  wardrobeCount: number;
  favoriteCount: number;
  onNavigate: (view: AppView) => void;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => onNavigate("home")}>
          <span className="brand__mark">衣</span>
          <span>
            <strong>衣搭</strong>
            <small>YIDA</small>
          </span>
        </button>

        <nav aria-label="主要导航" className="desktop-nav">
          <button className={view === "home" || view === "outfit" ? "is-active" : ""} onClick={() => onNavigate("home")} type="button">
            搭配
          </button>
          <button className={view === "wardrobe" ? "is-active" : ""} onClick={() => onNavigate("wardrobe")} type="button">
            衣柜 <span>{wardrobeCount}</span>
          </button>
          <button className={view === "favorites" ? "is-active" : ""} onClick={() => onNavigate("favorites")} type="button">
            收藏 <span>{favoriteCount}</span>
          </button>
        </nav>

        <button className="header-add" type="button" onClick={onAdd}>
          <Plus size={18} aria-hidden="true" /> 收录衣物
        </button>
      </header>

      <main>{children}</main>

      <nav className="mobile-nav" aria-label="手机导航">
        <button className={view === "home" || view === "outfit" ? "is-active" : ""} onClick={() => onNavigate("home")} type="button">
          <span aria-hidden="true">✦</span>搭配
        </button>
        <button className={view === "wardrobe" ? "is-active" : ""} onClick={() => onNavigate("wardrobe")} type="button">
          <Shirt size={19} aria-hidden="true" />衣柜
        </button>
        <button className={view === "favorites" ? "is-active" : ""} onClick={() => onNavigate("favorites")} type="button">
          <Heart size={19} aria-hidden="true" />收藏
        </button>
      </nav>
    </div>
  );
}
