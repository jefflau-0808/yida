import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  FavoriteRecord,
  GarmentRecord,
  GarmentView,
  ImageJobRecord,
  OutfitSnapshot,
  StoredImage,
} from "@/lib/domain/types";

interface YidaDB extends DBSchema {
  garments: {
    key: string;
    value: GarmentRecord;
    indexes: { byHash: string; byCategory: string };
  };
  images: {
    key: string;
    value: StoredImage;
  };
  outfitSnapshots: {
    key: string;
    value: OutfitSnapshot;
  };
  favorites: {
    key: string;
    value: FavoriteRecord;
    indexes: { byOutfit: string };
  };
  pendingJobs: {
    key: string;
    value: ImageJobRecord;
  };
  meta: {
    key: string;
    value: { key: string; value: string | number | boolean };
  };
}

let databasePromise: Promise<IDBPDatabase<YidaDB>> | undefined;

export function getDatabase(): Promise<IDBPDatabase<YidaDB>> {
  if (typeof indexedDB === "undefined") {
    throw new Error("当前浏览器不支持本地衣柜");
  }
  databasePromise ??= openDB<YidaDB>("yida", 1, {
    upgrade(database) {
      const garments = database.createObjectStore("garments", { keyPath: "id" });
      garments.createIndex("byHash", "imageHash", { unique: true });
      garments.createIndex("byCategory", "category");
      database.createObjectStore("images", { keyPath: "id" });
      database.createObjectStore("outfitSnapshots", { keyPath: "id" });
      const favorites = database.createObjectStore("favorites", { keyPath: "id" });
      favorites.createIndex("byOutfit", "outfitId", { unique: true });
      database.createObjectStore("pendingJobs", { keyPath: "jobId" });
      database.createObjectStore("meta", { keyPath: "key" });
    },
  });
  return databasePromise;
}

async function garmentToView(
  database: IDBPDatabase<YidaDB>,
  garment: GarmentRecord,
): Promise<GarmentView | undefined> {
  const image = await database.get("images", garment.imageId);
  if (!image) return undefined;
  return { ...garment, imageUrl: URL.createObjectURL(image.blob) };
}

export async function listGarments(): Promise<GarmentView[]> {
  const database = await getDatabase();
  const records = await database.getAll("garments");
  const views = await Promise.all(records.map((record) => garmentToView(database, record)));
  return views
    .filter((view): view is GarmentView => Boolean(view))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getGarmentByHash(
  imageHash: string,
): Promise<GarmentView | undefined> {
  const database = await getDatabase();
  const record = await database.getFromIndex("garments", "byHash", imageHash);
  return record ? garmentToView(database, record) : undefined;
}

export interface NewGarmentInput {
  id: string;
  imageId: string;
  imageHash: string;
  image: Blob;
  width: number;
  height: number;
  name: string;
  category: GarmentRecord["category"];
  type: string;
  color: string;
  pattern: string;
  fit: string;
}

export async function saveGarment(
  input: NewGarmentInput,
): Promise<{ garment: GarmentView; added: boolean }> {
  const database = await getDatabase();
  const existing = await database.getFromIndex("garments", "byHash", input.imageHash);
  if (existing) {
    const view = await garmentToView(database, existing);
    if (!view) throw new Error("已有衣物图片损坏，请删除后重新收录");
    return { garment: view, added: false };
  }

  const now = Date.now();
  const record: GarmentRecord = {
    id: input.id,
    imageId: input.imageId,
    imageHash: input.imageHash,
    name: input.name,
    category: input.category,
    type: input.type,
    color: input.color,
    pattern: input.pattern,
    fit: input.fit,
    origin: "user",
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
  const image: StoredImage = {
    id: input.imageId,
    blob: input.image,
    mime: input.image.type,
    width: input.width,
    height: input.height,
    origin: "upload",
    createdAt: now,
  };

  const transaction = database.transaction(["images", "garments"], "readwrite");
  await Promise.all([
    transaction.objectStore("images").add(image),
    transaction.objectStore("garments").add(record),
    transaction.done,
  ]);
  return { garment: { ...record, imageUrl: URL.createObjectURL(input.image) }, added: true };
}

export async function updateGarment(
  id: string,
  patch: Pick<GarmentRecord, "name" | "category" | "type" | "color" | "pattern" | "fit">,
): Promise<void> {
  const database = await getDatabase();
  const current = await database.get("garments", id);
  if (!current) throw new Error("找不到这件衣物");
  await database.put("garments", {
    ...current,
    ...patch,
    revision: current.revision + 1,
    updatedAt: Date.now(),
  });
}

export async function deleteGarment(id: string): Promise<void> {
  const database = await getDatabase();
  const current = await database.get("garments", id);
  if (!current) return;
  const transaction = database.transaction(["garments", "images"], "readwrite");
  await Promise.all([
    transaction.objectStore("garments").delete(id),
    transaction.objectStore("images").delete(current.imageId),
    transaction.done,
  ]);
}

export async function saveFavorite(snapshot: OutfitSnapshot): Promise<boolean> {
  const database = await getDatabase();
  const existing = await database.getFromIndex("favorites", "byOutfit", snapshot.id);
  if (existing) return false;
  const favorite: FavoriteRecord = {
    id: crypto.randomUUID(),
    outfitId: snapshot.id,
    snapshot,
    createdAt: Date.now(),
  };
  const transaction = database.transaction(["outfitSnapshots", "favorites"], "readwrite");
  await Promise.all([
    transaction.objectStore("outfitSnapshots").put(snapshot),
    transaction.objectStore("favorites").add(favorite),
    transaction.done,
  ]);
  return true;
}

export async function removeFavorite(id: string): Promise<void> {
  const database = await getDatabase();
  const favorite = await database.get("favorites", id);
  if (!favorite) return;
  const transaction = database.transaction(["favorites", "outfitSnapshots"], "readwrite");
  await Promise.all([
    transaction.objectStore("favorites").delete(id),
    transaction.objectStore("outfitSnapshots").delete(favorite.outfitId),
    transaction.done,
  ]);
}

export async function listFavorites(): Promise<
  Array<FavoriteRecord & { topImageUrl?: string }>
> {
  const database = await getDatabase();
  const favorites = await database.getAll("favorites");
  return Promise.all(
    favorites
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(async (favorite) => {
        const image = await database.get("images", favorite.snapshot.topImageId);
        return {
          ...favorite,
          topImageUrl: image
            ? URL.createObjectURL(image.blob)
            : favorite.snapshot.top.origin === "sample"
              ? "/demo/tee.jpg"
              : undefined,
        };
      }),
  );
}

export async function putPendingJob(job: ImageJobRecord): Promise<void> {
  const database = await getDatabase();
  await database.put("pendingJobs", job);
}

export async function removePendingJob(jobId: string): Promise<void> {
  const database = await getDatabase();
  await database.delete("pendingJobs", jobId);
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  const stores = [
    "garments",
    "images",
    "outfitSnapshots",
    "favorites",
    "pendingJobs",
    "meta",
  ] as const;
  const transaction = database.transaction(stores, "readwrite");
  await Promise.all([
    ...stores.map((store) => transaction.objectStore(store).clear()),
    transaction.done,
  ]);
}

export function resetDatabaseForTests(): void {
  databasePromise = undefined;
}
