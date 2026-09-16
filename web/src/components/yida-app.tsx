"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalData } from "@/hooks/use-local-data";
import { analyzeGarment, createImageJob, ensureSession, getImageJob, requestRecommendation } from "@/lib/client/api";
import { registerServiceWorker } from "@/lib/client/pwa";
import { outfitKey, resolveRecommendationMatch, similarGarment } from "@/lib/domain/matching";
import { SAMPLE_TOP } from "@/lib/domain/samples";
import { createOutfitSnapshot } from "@/lib/domain/snapshot";
import type { GarmentCategory, GarmentFeatures, GarmentView, ImageJobRecord, OutfitRecommendation, Scene } from "@/lib/domain/types";
import { normalizeImage } from "@/lib/images";
import { clearAllData, deleteGarment, removeFavorite, removePendingJob, saveFavorite, saveGarment, updateGarment, putPendingJob } from "@/lib/storage/db";
import { AppShell, type AppView } from "./app-shell";
import { FavoritesScreen } from "./favorites-screen";
import { GarmentEditor, garmentToForm, PhotoReview, type GarmentFormValue } from "./garment-editor";
import { HomeScreen } from "./home-screen";
import { OutfitScreen } from "./outfit-screen";
import { Button, Modal, Notice } from "./ui";
import { WardrobeScreen } from "./wardrobe-screen";

interface PhotoDraft {
  blob: Blob;
  hash: string;
  width: number;
  height: number;
  imageUrl: string;
}

interface PendingDuplicate {
  draft: PhotoDraft;
  form: GarmentFormValue;
  similar: GarmentView;
  purpose: "pair" | "save";
}

const DEFAULT_FEATURES: GarmentFeatures = {
  category: "top",
  type: "T 恤",
  color: "白色",
  pattern: "纯色",
  fit: "宽松",
};

export function YidaApp() {
  const { garments, favorites, loading, refresh } = useLocalData();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestVersion = useRef(0);
  const [view, setView] = useState<AppView>("home");
  const [uploadPurpose, setUploadPurpose] = useState<"pair" | "save">("pair");
  const [categoryHint, setCategoryHint] = useState<GarmentCategory>("top");
  const [draft, setDraft] = useState<PhotoDraft>();
  const [draftStage, setDraftStage] = useState<"review" | "editor">("review");
  const [draftForm, setDraftForm] = useState<GarmentFormValue>({ ...DEFAULT_FEATURES, name: "白色 T 恤" });
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<GarmentView>();
  const [duplicate, setDuplicate] = useState<PendingDuplicate>();
  const [activeTop, setActiveTop] = useState<GarmentView>();
  const [scene, setScene] = useState<Scene>("daily");
  const [recommendation, setRecommendation] = useState<OutfitRecommendation>();
  const [recommending, setRecommending] = useState(false);
  const [imageStatus, setImageStatus] = useState<"queued" | "running" | "succeeded" | "failed">();
  const [previousKeys, setPreviousKeys] = useState<string[]>([]);
  const [toast, setToast] = useState<string>();

  const resolvedTop = useMemo(
    () => activeTop ? garments.find((garment) => garment.id === activeTop.id) ?? activeTop : undefined,
    [activeTop, garments],
  );
  const saved = recommendation ? favorites.some((favorite) => favorite.outfitId === recommendation.id) : false;

  useEffect(() => {
    void ensureSession().catch(() => setError("匿名试用会话初始化失败，请刷新后重试。"));
    return registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function choosePhoto(purpose: "pair" | "save", hint: GarmentCategory = "top") {
    setUploadPurpose(purpose);
    setCategoryHint(hint);
    setError(undefined);
    inputRef.current?.click();
  }

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const normalized = await normalizeImage(file);
      if (draft) URL.revokeObjectURL(draft.imageUrl);
      setDraft({ ...normalized, imageUrl: URL.createObjectURL(normalized.blob) });
      setDraftStage("review");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "无法处理这张图片");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function recognizeDraft() {
    if (!draft) return;
    setBusy(true);
    setError(undefined);
    try {
      await ensureSession();
      const result = await analyzeGarment(draft.blob);
      const category = categoryHint;
      const features: GarmentFeatures = category === result.category
        ? result
        : {
            category,
            type: category === "bottom" ? "牛仔裤" : category === "shoes" ? "运动鞋" : result.type,
            color: result.color,
            pattern: result.pattern,
            fit: category === "bottom" ? "直筒" : category === "shoes" ? "低帮" : result.fit,
          };
      setDraftForm({ ...features, name: `${features.color}${features.type}` });
      setNotice(result.notice);
      setDraftStage("editor");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "识别失败，可重试或换图");
    } finally {
      setBusy(false);
    }
  }

  function closeDraft() {
    if (draft) URL.revokeObjectURL(draft.imageUrl);
    setDraft(undefined);
    setError(undefined);
    setNotice(undefined);
  }

  async function persistDraft(photo: PhotoDraft, form: GarmentFormValue, purpose: "pair" | "save") {
    setBusy(true);
    setError(undefined);
    try {
      const result = await saveGarment({
        id: crypto.randomUUID(),
        imageId: crypto.randomUUID(),
        imageHash: photo.hash,
        image: photo.blob,
        width: photo.width,
        height: photo.height,
        ...form,
      });
      await refresh();
      setToast(result.added ? "已收录衣柜，下次可直接选用。" : "这张照片已收录，已复用原衣物。 ");
      closeDraft();
      setDuplicate(undefined);
      if (purpose === "pair" && result.garment.category === "top") startFromTop(result.garment);
      else setView("wardrobe");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存失败，草稿仍保留在当前页面");
    } finally {
      setBusy(false);
    }
  }

  async function submitDraft(form: GarmentFormValue) {
    if (!draft) return;
    const exact = garments.find((garment) => garment.imageHash === draft.hash);
    if (exact) {
      setToast("相同照片已在衣柜，已直接复用。 ");
      closeDraft();
      if (uploadPurpose === "pair" && exact.category === "top") startFromTop(exact);
      else setView("wardrobe");
      return;
    }
    const similar = similarGarment(garments, form);
    if (similar) {
      setDuplicate({ draft, form, similar, purpose: uploadPurpose });
      setDraft(undefined);
      return;
    }
    await persistDraft(draft, form, uploadPurpose);
  }

  function useSimilar() {
    if (!duplicate) return;
    URL.revokeObjectURL(duplicate.draft.imageUrl);
    setDuplicate(undefined);
    setToast("已使用衣柜中的相似衣物。 ");
    if (duplicate.purpose === "pair" && duplicate.similar.category === "top") startFromTop(duplicate.similar);
    else setView("wardrobe");
  }

  function startFromTop(top: GarmentView) {
    requestVersion.current += 1;
    setActiveTop(top);
    setRecommendation(undefined);
    setPreviousKeys([]);
    setImageStatus(undefined);
    setError(undefined);
    setView("outfit");
  }

  async function generateRecommendation() {
    if (!resolvedTop || recommending) return;
    const version = ++requestVersion.current;
    setRecommending(true);
    setError(undefined);
    try {
      await ensureSession();
      const candidates = garments
        .filter((garment) => garment.category !== "top")
        .slice(0, 24)
        .map(({ id, name, category, type, color, pattern, fit }) => ({ id, name, category, type, color, pattern, fit }));
      let next: OutfitRecommendation | undefined;
      let key = "";
      let retryHistory = [...previousKeys];
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await requestRecommendation({
          requestId: crypto.randomUUID(),
          top: {
            id: resolvedTop.id,
            name: resolvedTop.name,
            category: resolvedTop.category,
            type: resolvedTop.type,
            color: resolvedTop.color,
            pattern: resolvedTop.pattern,
            fit: resolvedTop.fit,
          },
          scene,
          candidates,
          previousKeys: retryHistory,
        });
        if (version !== requestVersion.current) return;
        const bottom = resolveRecommendationMatch(garments, response.bottom);
        const shoes = resolveRecommendationMatch(garments, response.shoes);
        key = outfitKey(resolvedTop.id, scene, bottom, shoes);
        if (!previousKeys.includes(key)) {
          next = { ...response, id: key, top: resolvedTop, scene, bottom, shoes };
          break;
        }
        retryHistory = [...retryHistory, `retry-${attempt}`];
      }
      if (!next) {
        setError("暂时没有新的组合了，试试切换使用场景。 ");
        return;
      }
      setRecommendation(next);
      setPreviousKeys((keys) => [...keys, key].slice(-8));
      if (next.mock) {
        setImageStatus("queued");
        void runImageJob(next, version, key);
      } else {
        // Real image generation is a separate, budgeted M3 capability. Until it is
        // enabled, the result board uses clearly labelled local reference assets.
        setImageStatus("succeeded");
      }
    } catch (nextError) {
      if (version === requestVersion.current) setError(nextError instanceof Error ? nextError.message : "推荐暂时不可用");
    } finally {
      if (version === requestVersion.current) setRecommending(false);
    }
  }

  async function runImageJob(outfit: OutfitRecommendation, version: number, key: string) {
    try {
      const created = await createImageJob({ outfitId: outfit.id, requestHash: key, idempotencyKey: crypto.randomUUID() });
      await putPendingJob({
        jobId: created.jobId,
        requestVersion: version,
        outfitId: outfit.id,
        status: created.status,
        expiresAt: created.expiresAt,
      } as ImageJobRecord);
      let current = created;
      while (current.status === "queued" || current.status === "running") {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        current = await getImageJob(created.jobId);
        if (version !== requestVersion.current) return;
        setImageStatus(current.status === "queued" ? "queued" : current.status === "running" ? "running" : current.status === "succeeded" ? "succeeded" : "failed");
      }
      await removePendingJob(created.jobId);
    } catch (nextError) {
      if (version === requestVersion.current) {
        setImageStatus("failed");
        setError(nextError instanceof Error ? `文字建议可用；${nextError.message}` : "整套示意暂时失败，文字建议仍可使用");
      }
    }
  }

  async function saveCurrentFavorite() {
    if (!recommendation) return;
    try {
      const added = await saveFavorite(createOutfitSnapshot(recommendation));
      await refresh();
      setToast(added ? "已收藏这套搭配。" : "这套搭配已经收藏过了。 ");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "收藏失败");
    }
  }

  async function submitEdit(value: GarmentFormValue) {
    if (!editing) return;
    setBusy(true);
    try {
      await updateGarment(editing.id, value);
      setEditing(undefined);
      await refresh();
      setToast("衣物信息已更新。 ");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "更新失败");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete(garment: GarmentView) {
    if (!window.confirm(`删除“${garment.name}”？收藏的历史文字仍会保留。`)) return;
    await deleteGarment(garment.id);
    await refresh();
    setToast("已从衣柜删除。 ");
  }

  async function confirmClear() {
    if (!window.confirm("清空衣柜、收藏及本地照片？此操作无法恢复。")) return;
    await clearAllData();
    await refresh();
    setActiveTop(undefined);
    setRecommendation(undefined);
    setView("home");
    setToast("本地衣柜与收藏已清空。 ");
  }

  function changeScene(next: Scene) {
    requestVersion.current += 1;
    setScene(next);
    setRecommendation(undefined);
    setPreviousKeys([]);
    setImageStatus(undefined);
    setError(undefined);
  }

  return (
    <AppShell
      view={view}
      wardrobeCount={garments.length}
      favoriteCount={favorites.length}
      onNavigate={(next) => setView(next)}
      onAdd={() => choosePhoto("save")}
    >
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void onFile(event.target.files?.[0])} />
      {toast ? <div className="toast" role="status">{toast}</div> : null}
      {view === "home" ? (
        <HomeScreen
          garmentCount={garments.filter((garment) => garment.category === "top").length}
          onChoosePhoto={() => choosePhoto("pair")}
          onChooseWardrobe={() => setView("wardrobe")}
          onTrySample={() => startFromTop(SAMPLE_TOP)}
        />
      ) : null}
      {view === "wardrobe" ? (
        <WardrobeScreen garments={garments} loading={loading} onAdd={() => choosePhoto("save")} onEdit={setEditing} onDelete={(garment) => void confirmDelete(garment)} onPair={startFromTop} onClear={() => void confirmClear()} />
      ) : null}
      {view === "favorites" ? <FavoritesScreen favorites={favorites} onRemove={(id) => void removeFavorite(id).then(refresh)} /> : null}
      {view === "outfit" && resolvedTop ? (
        <OutfitScreen
          top={resolvedTop}
          garments={garments}
          scene={scene}
          recommendation={recommendation}
          recommending={recommending}
          imageStatus={imageStatus}
          error={error}
          saved={saved}
          onSceneChange={changeScene}
          onRecommend={() => void generateRecommendation()}
          onAnother={() => void generateRecommendation()}
          onFavorite={() => void saveCurrentFavorite()}
          onBack={() => setView("home")}
          onAddSimilar={(category) => choosePhoto("save", category)}
        />
      ) : null}

      {draft && draftStage === "review" ? <PhotoReview imageUrl={draft.imageUrl} busy={busy} error={error} onRecognize={() => void recognizeDraft()} onClose={closeDraft} /> : null}
      {draft && draftStage === "editor" ? <GarmentEditor imageUrl={draft.imageUrl} initial={draftForm} busy={busy} mode={uploadPurpose} analyzeNotice={notice} onSubmit={(value) => void submitDraft(value)} onClose={closeDraft} /> : null}
      {editing ? <GarmentEditor imageUrl={editing.imageUrl} initial={garmentToForm(editing)} busy={busy} mode="edit" onSubmit={(value) => void submitEdit(value)} onClose={() => setEditing(undefined)} /> : null}
      {duplicate ? (
        <Modal title="衣柜里有一件很相似" onClose={() => { setDraft(duplicate.draft); setDuplicate(undefined); }}>
          <div className="duplicate-dialog">
            <img src={duplicate.similar.imageUrl} alt={duplicate.similar.name} />
            <div>
              <h3>{duplicate.similar.name}</h3>
              <p>{duplicate.similar.color} · {duplicate.similar.fit} · {duplicate.similar.pattern}</p>
              <Notice tone="warning">标签相同不能证明是同一件，请由你决定。</Notice>
            </div>
          </div>
          <div className="modal-actions">
            <Button tone="secondary" onClick={useSimilar}>使用已有</Button>
            <Button onClick={() => void persistDraft(duplicate.draft, duplicate.form, duplicate.purpose)} disabled={busy}>这是另一件，仍然保存</Button>
          </div>
        </Modal>
      ) : null}
    </AppShell>
  );
}
