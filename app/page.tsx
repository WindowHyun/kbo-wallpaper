"use client";

import { useEffect, useMemo, useState } from "react";
import { TEAMS } from "@/lib/teams";
import { RESOLUTIONS, STYLES, supportsLight, isStyleId } from "@/lib/presets";

function currentKST() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export default function Home() {
  const now = currentKST();
  const [teamId, setTeamId] = useState("OB");
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [style, setStyle] = useState<string>("minimal");
  const [res, setRes] = useState<string>("iphone-15-pro");
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const teamParam = TEAMS.find((t) => t.id === teamId)?.en ?? teamId;
  const lightOk = isStyleId(style) && supportsLight(style);
  const effMode = lightOk ? mode : "dark";
  const common = `team=${teamParam}&style=${style}&mode=${effMode}&res=${res}`;
  // 미리보기/다운로드: 선택한 연·월 고정
  const path = `/api/wallpaper?${common}&year=${year}&month=${month}`;
  // 자동 업데이트 URL: 연·월 생략 → 매달 KST 현재 달로 자동 갱신
  const autoPath = `/api/wallpaper?${common}`;

  // 미리보기는 실제 해상도를 쓰되 CSS로 축소
  const previewUrl = useMemo(() => path, [path]);

  // origin 은 클라이언트에서만 알 수 있으므로 mount 후 채운다 (SSR 하이드레이션 불일치 방지)
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const absoluteUrl = origin + autoPath;

  const yearOpts = [now.year, now.year - 1];

  async function download() {
    try {
      setDownloading(true);
      const r = await fetch(path);
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `kbo-${teamParam}-${year}-${String(month).padStart(2, "0")}-${style}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(u);
    } catch (e) {
      alert("다운로드 실패: " + (e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert(absoluteUrl);
    }
  }

  return (
    <main className="wrap">
      <div className="title">⚾ KBO 월페이퍼 생성기</div>
      <div className="subtitle">
        구단별 한 달 경기 일정·결과를 잠금화면 배경으로. 아래 자동 업데이트 URL을 단축어에 넣으면
        매일 최신 결과가 반영됩니다.
      </div>

      {/* 팀 */}
      <div className="section">
        <div className="label">구단</div>
        <div className="team-grid">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              className="team-btn"
              data-active={t.id === teamId}
              style={{ ["--c" as string]: t.primary }}
              onClick={() => setTeamId(t.id)}
            >
              {t.short}
            </button>
          ))}
        </div>
      </div>

      {/* 연/월 */}
      <div className="section">
        <div className="label">연도 / 월</div>
        <div className="row2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearOpts.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 스타일 */}
      <div className="section">
        <div className="label">스타일</div>
        <div className="chips">
          {STYLES.filter((s) => s.group === "calendar").map((s) => (
            <button key={s.id} className="chip" data-active={s.id === style} onClick={() => setStyle(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="label" style={{ marginTop: 14 }}>시즌 그리드</div>
        <div className="chips">
          {STYLES.filter((s) => s.group === "season").map((s) => (
            <button key={s.id} className="chip" data-active={s.id === style} onClick={() => setStyle(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 모드 */}
      <div className="section">
        <div className="label">모드</div>
        <div className="chips">
          {(["dark", "light"] as const).map((m) => (
            <button key={m} className="chip" data-active={effMode === m} disabled={!lightOk && m === "light"} onClick={() => setMode(m)} style={!lightOk && m === "light" ? { opacity: 0.4 } : undefined}>
              {m === "dark" ? "DARK" : "LIGHT"}
            </button>
          ))}
          {!lightOk && <span className="hint" style={{ alignSelf: "center", margin: 0 }}>이 스타일은 다크 전용</span>}
        </div>
      </div>

      {/* 해상도 */}
      <div className="section">
        <div className="label">해상도</div>
        <select value={res} onChange={(e) => setRes(e.target.value)}>
          {RESOLUTIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* 미리보기 */}
      <div className="section">
        <div className="label">미리보기</div>
        <div className="preview">
          {/* key 로 src 변경 시 로딩 상태 리셋 */}
          <img
            key={previewUrl}
            src={previewUrl}
            alt="미리보기"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            onLoadStart={() => setLoading(true)}
          />
          {loading && <div className="spinner">불러오는 중…</div>}
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={download} disabled={downloading}>
            {downloading ? "내려받는 중…" : "PNG 다운로드"}
          </button>
          <button className="btn btn-ghost" onClick={copyUrl}>
            {copied ? "✓ 복사됨" : "자동 업데이트 URL 복사"}
          </button>
        </div>

        <div className="urlbox">{absoluteUrl}</div>

        <div className="hint">
          <b>이 URL은 월·연도가 없어 매달 자동으로 이번 달로 바뀝니다.</b> (매일 결과 + 매달 달력
          자동 갱신) 특정 달 이미지를 그대로 저장하려면 “PNG 다운로드”를 쓰세요.
          <br />
          <b>iOS</b>: 단축어 → “URL 콘텐츠 가져오기”에 위 URL → “배경화면 설정”, 자동화로 매일 실행.
          · <b>Android</b>: KWGT/배경 자동변경 앱에 URL 등록.
        </div>
      </div>

      <footer>
        데이터 출처: KBO 공식(koreabaseball.com). 본 서비스는 비공식 팬 프로젝트입니다.
      </footer>
    </main>
  );
}
