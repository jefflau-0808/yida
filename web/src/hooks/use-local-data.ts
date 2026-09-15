"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FavoriteRecord, GarmentView } from "@/lib/domain/types";
import {
  listFavorites,
  listGarments,
} from "@/lib/storage/db";

export type FavoriteView = FavoriteRecord & { topImageUrl?: string };

export function useLocalData() {
  const [garments, setGarments] = useState<GarmentView[]>([]);
  const [favorites, setFavorites] = useState<FavoriteView[]>([]);
  const [loading, setLoading] = useState(true);
  const urls = useRef<Set<string>>(new Set());

  const replaceUrls = useCallback((nextUrls: Array<string | undefined>) => {
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current = new Set(nextUrls.filter((url): url is string => Boolean(url)));
  }, []);

  const refresh = useCallback(async () => {
    const [nextGarments, nextFavorites] = await Promise.all([
      listGarments(),
      listFavorites(),
    ]);
    replaceUrls([
      ...nextGarments.map((item) => item.imageUrl),
      ...nextFavorites.map((item) => item.topImageUrl),
    ]);
    setGarments(nextGarments);
    setFavorites(nextFavorites);
    setLoading(false);
  }, [replaceUrls]);

  useEffect(() => {
    void refresh().catch(() => setLoading(false));
    return () => {
      for (const url of urls.current) URL.revokeObjectURL(url);
    };
  }, [refresh]);

  return { garments, favorites, loading, refresh };
}
