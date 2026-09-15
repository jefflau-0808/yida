"use client";

import { Camera, ChevronRight, ImagePlus, LockKeyhole } from "lucide-react";
import { Button } from "./ui";

export function HomeScreen({
  garmentCount,
  onChoosePhoto,
  onChooseWardrobe,
  onTrySample,
}: {
  garmentCount: number;
  onChoosePhoto: () => void;
  onChooseWardrobe: () => void;
  onTrySample: () => void;
}) {
  return (
    <>
      <section className="hero page-wrap">
        <div className="hero__copy">
          <p className="eyebrow">YOUR CLOSET, BETTER CONNECTED</p>
          <h1>从一件上衣开始，<br />找到今天的完整搭配。</h1>
          <p className="hero__lead">
            拍下手边的上衣，确认几个简单标签，就能得到裤子与鞋子的具体建议。衣柜会在每次使用中自然长大。
          </p>
          <div className="hero__actions">
            <Button onClick={onChoosePhoto}>
              <Camera size={19} aria-hidden="true" /> 拍照或上传
            </Button>
            <Button tone="secondary" onClick={onChooseWardrobe} disabled={garmentCount === 0}>
              从衣柜选上衣 <ChevronRight size={18} aria-hidden="true" />
            </Button>
          </div>
          <button className="text-link" type="button" onClick={onTrySample}>
            先用示例体验完整流程 <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="hero__visual" aria-label="衣物搭配示例">
          <div className="hero__number">01</div>
          <img className="hero__image" src="/demo/tee.jpg" alt="白色圆领 T 恤示例" />
          <div className="hero__caption">
            <span>选择一件上衣</span>
            <strong>让建议从真实衣物出发</strong>
          </div>
        </div>
      </section>

      <section className="how-it-works page-wrap" aria-labelledby="how-title">
        <div>
          <p className="eyebrow">THREE SIMPLE STEPS</p>
          <h2 id="how-title">不用先整理整柜衣服。</h2>
        </div>
        <ol>
          <li><span>01</span><strong>拍一件</strong><p>选择上衣照片，确认识别标签。</p></li>
          <li><span>02</span><strong>看建议</strong><p>得到裤型、颜色、鞋款与整套示意。</p></li>
          <li><span>03</span><strong>慢慢积累</strong><p>确认过的真实衣物自动进入本地衣柜。</p></li>
        </ol>
      </section>

      <section className="privacy-strip">
        <div className="page-wrap">
          <LockKeyhole size={20} aria-hidden="true" />
          <p><strong>当前浏览器，本地保存。</strong> 清除浏览器数据可能丢失，暂不支持跨设备同步；请避免上传含人脸等私人信息的照片。</p>
          <ImagePlus size={24} aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
