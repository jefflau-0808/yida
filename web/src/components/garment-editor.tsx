"use client";

import { useEffect, useState } from "react";
import type { GarmentCategory, GarmentFeatures, GarmentView } from "@/lib/domain/types";
import { CATEGORY_LABELS, FEATURE_OPTIONS } from "@/lib/domain/types";
import { Button, Modal, Notice, Spinner } from "./ui";

export interface GarmentFormValue extends GarmentFeatures {
  name: string;
}

export function PhotoReview({
  imageUrl,
  busy,
  error,
  onRecognize,
  onClose,
}: {
  imageUrl: string;
  busy: boolean;
  error?: string;
  onRecognize: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title="先确认这张照片" onClose={onClose}>
      <div className="photo-review">
        <img src={imageUrl} alt="刚选择的衣物" />
        <div>
          <p className="eyebrow">NOT SENT YET</p>
          <h3>照片尚未发送识别</h3>
          <p>点击“识别衣物”后，压缩照片会发送给当前配置的识别服务。确认保存后，它才会进入本地衣柜。</p>
          <p className="privacy-copy">请只上传衣物，尽量避免人脸、证件或其他私人信息。</p>
          {error ? <Notice tone="warning">{error}</Notice> : null}
          <div className="modal-actions">
            <Button tone="quiet" onClick={onClose}>重新选择</Button>
            <Button onClick={onRecognize} disabled={busy}>
              {busy ? <Spinner label="正在识别" /> : "识别衣物"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function optionsFor(category: GarmentCategory) {
  return FEATURE_OPTIONS[category];
}

export function GarmentEditor({
  imageUrl,
  initial,
  busy,
  mode,
  analyzeNotice,
  onSubmit,
  onClose,
}: {
  imageUrl: string;
  initial: GarmentFormValue;
  busy: boolean;
  mode: "pair" | "save" | "edit";
  analyzeNotice?: string;
  onSubmit: (value: GarmentFormValue) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);

  useEffect(() => setValue(initial), [initial]);

  function set<K extends keyof GarmentFormValue>(key: K, next: GarmentFormValue[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  function setCategory(category: GarmentCategory) {
    const options = optionsFor(category);
    setValue((current) => ({
      ...current,
      category,
      type: options.types[0],
      fit: options.fits[0],
    }));
  }

  return (
    <Modal title={mode === "edit" ? "编辑衣物" : "确认这件衣物"} onClose={onClose}>
      <div className="editor-grid">
        <div className="editor-photo">
          <img src={imageUrl} alt="待确认的衣物" />
          <span>真实照片</span>
        </div>
        <form
          className="editor-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(value);
          }}
        >
          {analyzeNotice ? <Notice tone="warning">{analyzeNotice}</Notice> : null}
          <label>
            名称
            <input required maxLength={80} value={value.name} onChange={(event) => set("name", event.target.value)} />
          </label>
          <label>
            类别
            <select value={value.category} onChange={(event) => setCategory(event.target.value as GarmentCategory)}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
            </select>
          </label>
          <div className="form-pair">
            <label>
              类型
              <select value={value.type} onChange={(event) => set("type", event.target.value)}>
                {optionsFor(value.category).types.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              主色
              <select value={value.color} onChange={(event) => set("color", event.target.value)}>
                {FEATURE_OPTIONS.colors.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="form-pair">
            <label>
              图案
              <select value={value.pattern} onChange={(event) => set("pattern", event.target.value)}>
                {FEATURE_OPTIONS.patterns.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              版型
              <select value={value.fit} onChange={(event) => set("fit", event.target.value)}>
                {optionsFor(value.category).fits.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="editor-note">
            {mode === "pair" ? "确认后自动存入衣柜，并开始搭配。" : "只保存你确认过的真实衣物。"}
          </div>
          <div className="modal-actions">
            <Button type="button" tone="quiet" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={busy || !value.name.trim()}>
              {busy ? <Spinner label="正在保存" /> : mode === "pair" ? "确认并搭配" : "确认并保存"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function garmentToForm(garment: GarmentView): GarmentFormValue {
  return {
    name: garment.name,
    category: garment.category,
    type: garment.type,
    color: garment.color,
    pattern: garment.pattern,
    fit: garment.fit,
  };
}
