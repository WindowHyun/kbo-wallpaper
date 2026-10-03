"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { TEAMS } from "@/lib/teams";
import { accentFor } from "@/lib/color";
import { RESOLUTIONS, STYLES, supportsLight, needsSeasonData, isStyleId } from "@/lib/presets";

function currentKST() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

// ─── 아이콘 ──────────────────────────────────────────────────────────────────
const ICONS = {
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  download: <><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16v.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  refresh: <><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v5h-5" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
} as const;
type IconName = keyof typeof ICONS;

function Icon({ name, size = 18, stroke = 2, className }: { name: IconName; size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {ICONS[name]}
    </svg>
  );
}

// ─── 미리보기 로더 ─────────────────────────────────────────────────────────────
// fetch 로 받아 blob URL 로 보여 준다: 서버 오류 메시지를 화면에 띄울 수 있고,
// 새로 만드는 동안 이전 이미지를 그대로 두며, 하이드레이션 전 이미지 로드 경합도 없다.
interface Preview { status: "loading" | "ok" | "error"; src: string | null; error?: string }

function usePreview(url: string, retryKey: number): Preview {
  const [st, setSt] = useState<Preview>({ status: "loading", src: null });
  const cur = useRef<string | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    let alive = true;
    setSt((p) => ({ ...p, status: "loading", error: undefined }));
    (async () => {
      try {
        const r = await fetch(url, { signal: ctl.signal });
        if (!r.ok) {
          const text = (await r.text().catch(() => "")).trim();
          throw new Error(text && text.length <= 160 && !text.startsWith("<") ? text : "서버가 이미지를 만들지 못했어요");
        }
        const blob = await r.blob();
        if (!alive) return;
        const next = URL.createObjectURL(blob);
        if (cur.current) URL.revokeObjectURL(cur.current);
        cur.current = next;
        setSt({ status: "ok", src: next });
      } catch (e) {
        if (!alive || (e as Error).name === "AbortError") return;
        setSt((p) => ({ ...p, status: "error", error: (e as Error).message || "네트워크 연결을 확인해 주세요" }));
      }
    })();
    return () => { alive = false; ctl.abort(); };
  }, [url, retryKey]);

  useEffect(() => () => { if (cur.current) URL.revokeObjectURL(cur.current); }, []);
  return st;
}

function Screen({ st, seasonHint, onRetry }: { st: Preview; seasonHint: boolean; onRetry: () => void }) {
  return (
    <>
      {st.src && /* API가 즉석 생성하는 PNG 라 next/image 최적화가 무의미 — 원본 <img> 사용 */
        // eslint-disable-next-line @next/next/no-img-element
        <img src={st.src} alt="월페이퍼 미리보기" />}
      {st.status === "loading" && (
        <div className="veil late" role="status">
          <Icon name="spinner" size={26} className="spin" />
          <div>
            <strong>이미지를 만드는 중이에요</strong>
            {seasonHint ? "시즌 스타일은 5~10초 걸릴 수 있어요." : st.src ? "이전 미리보기는 그대로 둬요." : null}
          </div>
        </div>
      )}
      {st.status === "error" && (
        <div className="veil solid" role="alert">
          <div className="err"><Icon name="alert" />미리보기를 만들지 못했어요</div>
          <div>{st.error}</div>
          <button type="button" className="btn btn-retry" onClick={onRetry}><Icon name="refresh" />다시 시도</button>
        </div>
      )}
    </>
  );
}

// ─── 작은 컴포넌트들 ───────────────────────────────────────────────────────────
function Seg<T extends string>({ labelledBy, value, onChange, options, narrow }: {
  labelledBy: string; value: T; onChange: (v: T) => void; options: { v: T; label: string; disabled?: boolean }[]; narrow?: boolean;
}) {
  return (
    <div role="group" aria-labelledby={labelledBy} className={narrow ? "seg narrow" : "seg"}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={o.v === value} disabled={o.disabled} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

function SelectBox({ id, value, onChange, children }: { id: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="select-wrap">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      <Icon name="chevron" size={20} />
    </div>
  );
}

const FOCUSABLE = 'button:not([disabled]),[href],select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// 모바일 미리보기 시트: role=dialog · Esc 닫기 · 포커스 이동/복귀 · Tab 순환
function PreviewSheet({ subtitle, ar, onClose, children, actions }: {
  subtitle: string; ar: number; onClose: () => void; children: React.ReactNode; actions: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // onClose 는 ref 로 들고 있어 부모가 다시 렌더돼도 포커스·키 핸들러가 다시 설정되지 않는다
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeRef.current(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1], cur = document.activeElement;
      if (e.shiftKey && (cur === first || cur === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);

  return (
    <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="grab" aria-hidden="true" />
        <div className="sheet-head">
          <div>
            <h2 id={titleId}>미리보기</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기"><Icon name="close" size={22} /></button>
        </div>
        <div className="sheet-body">
          <div className="phone in-sheet" style={{ ["--ar" as string]: ar }}>{children}</div>
        </div>
        {actions}
      </div>
    </div>
  );
}

// ─── 페이지 ──────────────────────────────────────────────────────────────────
export default function Home() {
  const now = currentKST();
  const [teamId, setTeamId] = useState("OB");
  const [period, setPeriod] = useState<"auto" | "custom">("auto");
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [style, setStyle] = useState<string>("minimal");
  const [res, setRes] = useState<string>("iphone-15-pro");
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [retryKey, setRetryKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const urlRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const labelIds = { team: useId(), style: useId(), mode: useId(), period: useId(), url: useId() };
  const resId = useId(), yearId = useId(), monthId = useId();

  const team = TEAMS.find((t) => t.id === teamId) ?? TEAMS[0];
  const teamParam = team.en;
  const lightOk = isStyleId(style) && supportsLight(style);
  const effMode = lightOk ? mode : "dark";
  const resolution = RESOLUTIONS.find((r) => r.id === res) ?? RESOLUTIONS[0];
  const ar = Math.round((resolution.width / resolution.height) * 10000) / 10000;
  const styleLabel = STYLES.find((s) => s.id === style)?.label.split(" · ")[0] ?? style;
  const seasonHint = isStyleId(style) && needsSeasonData(style);

  const common = `team=${teamParam}&style=${style}&mode=${effMode}&res=${res}`;
  const shownYear = period === "custom" ? year : now.year;
  const shownMonth = period === "custom" ? month : now.month;
  // 미리보기: 자동 모드는 연·월을 생략해 실제 자동 업데이트 URL 과 같은 결과를 보여 준다. 축소본(scale)으로 전송량 절감.
  const previewUrl = `/api/wallpaper?${common}${period === "custom" ? `&year=${year}&month=${month}` : ""}&scale=0.5`;
  const downloadPath = `/api/wallpaper?${common}&year=${shownYear}&month=${shownMonth}`;
  const autoPath = `/api/wallpaper?${common}`;

  const st = usePreview(previewUrl, retryKey);
  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  // origin 은 클라이언트에서만 알 수 있다 (SSR 렌더에서는 빈 문자열 → 하이드레이션 불일치 방지)
  const origin = useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");
  const absoluteUrl = origin + autoPath;

  const yearOpts = useMemo(() => Array.from({ length: 5 }, (_, i) => now.year - i), [now.year]);
  const subtitle = `${team.short} · ${styleLabel} · ${effMode === "dark" ? "다크" : "라이트"} · ${shownYear}년 ${shownMonth}월`;

  function say(text: string, tone: "ok" | "err") {
    clearTimeout(toastTimer.current);
    setToast({ text, tone });
    toastTimer.current = setTimeout(() => setToast(null), tone === "ok" ? 2500 : 6000);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      say("자동 업데이트 URL을 복사했어요", "ok");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한이 없으면 URL 을 선택해 두어 직접 복사할 수 있게 한다
      const el = urlRef.current;
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); }
      say("복사하지 못했어요. 선택된 URL을 직접 복사해 주세요", "err");
    }
  }

  async function download() {
    try {
      setDownloading(true);
      const r = await fetch(downloadPath);
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `kbo-${teamParam}-${shownYear}-${String(shownMonth).padStart(2, "0")}-${style}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(u);
    } catch (e) {
      say(`PNG를 저장하지 못했어요: ${(e as Error).message}`, "err");
    } finally {
      setDownloading(false);
    }
  }

  const actionButtons = (
    <div className="actions">
      <button type="button" className="btn btn-primary" data-done={copied} onClick={copyUrl}>
        <Icon name={copied ? "check" : "copy"} size={copied ? 18 : 20} stroke={copied ? 2.4 : 2} />
        {copied ? "복사했어요" : "URL 복사"}
      </button>
      <button type="button" className="btn btn-ghost btn-png" onClick={download} disabled={downloading} aria-label="PNG로 저장">
        <Icon name="download" size={20} />
        <span className="lbl">{downloading ? "저장 중…" : "PNG 저장"}</span>
      </button>
    </div>
  );

  return (
    <main className="page">
      <header className="topbar">
        <h1 className="title">KBO 월페이퍼 생성기</h1>
        <button type="button" className="peek" onClick={() => setSheetOpen(true)} aria-label="미리보기 크게 보기">
          <span className="mini">
            {st.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={st.src} alt="" />
            )}
          </span>
          미리보기
          <Icon name="expand" size={16} />
        </button>
      </header>
      <p className="lead">
        구단별 한 달 경기 일정·결과를 잠금화면 배경으로 만들어요. 자동 업데이트 URL을 단축어에 넣으면 매일 최신 결과가 반영돼요.
      </p>

      <div className="layout">
        <div className="controls">
          {/* 구단 */}
          <section>
            <h2 className="label" id={labelIds.team}>구단</h2>
            <div className="team-grid" role="group" aria-labelledby={labelIds.team}>
              {TEAMS.map((t) => (
                <button key={t.id} type="button" className="team" aria-pressed={t.id === teamId}
                  // 어두운 대표색(두산·롯데·키움)은 패널 위에서 안 보이므로 대비를 보정한 색을 쓴다
                  style={{ ["--c" as string]: accentFor(t, "#14161d") }} onClick={() => setTeamId(t.id)}>
                  <span className="dot" aria-hidden="true" />
                  {t.short}
                </button>
              ))}
            </div>
          </section>

          {/* 스타일 */}
          <section>
            <h2 className="label" id={labelIds.style}>스타일</h2>
            <div className="sublabel">달력</div>
            <div className="chips" role="group" aria-labelledby={labelIds.style}>
              {STYLES.filter((s) => s.group === "calendar").map((s) => (
                <button key={s.id} type="button" className="chip" aria-pressed={s.id === style} onClick={() => setStyle(s.id)}>
                  {s.id === style && <Icon name="check" size={14} stroke={2.6} />}{s.label}
                </button>
              ))}
            </div>
            <div className="sublabel" style={{ marginTop: 16 }}>시즌 그리드</div>
            <div className="chips" role="group" aria-labelledby={labelIds.style}>
              {STYLES.filter((s) => s.group === "season").map((s) => (
                <button key={s.id} type="button" className="chip" aria-pressed={s.id === style} onClick={() => setStyle(s.id)}>
                  {s.id === style && <Icon name="check" size={14} stroke={2.6} />}{s.label}
                </button>
              ))}
            </div>
          </section>

          {/* 모드 · 해상도 */}
          <div className="row">
            <section>
              <h2 className="label" id={labelIds.mode}>모드</h2>
              <Seg labelledBy={labelIds.mode} value={effMode} onChange={setMode}
                options={[{ v: "dark", label: "다크" }, { v: "light", label: "라이트", disabled: !lightOk }]} />
              {!lightOk && (
                <div className="hintline"><Icon name="info" size={16} /><span>이 스타일은 다크만 지원해요. 라이트를 지원하는 스타일로 바꾸면 선택할 수 있어요.</span></div>
              )}
            </section>
            <section style={{ flex: "2 1 280px" }}>
              <label className="label" htmlFor={resId}>해상도</label>
              <SelectBox id={resId} value={res} onChange={setRes}>
                {RESOLUTIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </SelectBox>
            </section>
          </div>

          {/* 기간 */}
          <section>
            <h2 className="label" id={labelIds.period}>기간</h2>
            <Seg narrow labelledBy={labelIds.period} value={period} onChange={setPeriod}
              options={[{ v: "auto", label: "이번 달 (자동)" }, { v: "custom", label: "특정 달" }]} />
            {period === "custom" && (
              <div className="pair">
                <div>
                  <label className="sublabel" htmlFor={yearId} style={{ display: "block" }}>연도</label>
                  <SelectBox id={yearId} value={year} onChange={(v) => setYear(Number(v))}>
                    {yearOpts.map((y) => <option key={y} value={y}>{y}년</option>)}
                  </SelectBox>
                </div>
                <div>
                  <label className="sublabel" htmlFor={monthId} style={{ display: "block" }}>월</label>
                  <SelectBox id={monthId} value={month} onChange={(v) => setMonth(Number(v))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
                  </SelectBox>
                </div>
              </div>
            )}
            <p className="note">
              URL에 연·월이 없어서 매달 자동으로 이번 달로 바뀌어요. 지난 달을 PNG로 저장하려면 ‘특정 달’을 선택하세요.
            </p>
          </section>
        </div>

        {/* 미리보기 + 결과 — 옵션을 바꾸면 바로 보이는 위치 */}
        <aside className="side" aria-label="미리보기와 결과">
          <figure className="phone-wrap">
            <div className="phone" style={{ ["--ar" as string]: ar }}>
              <Screen st={st} seasonHint={seasonHint} onRetry={retry} />
            </div>
            <figcaption className="caption">미리보기 · {resolution.width}×{resolution.height} · {shownYear}년 {shownMonth}월</figcaption>
          </figure>

          <section className="result" aria-labelledby={labelIds.url}>
            <h2 className="label" id={labelIds.url} style={{ margin: 0 }}>자동 업데이트 URL</h2>
            <code className="urlbox" ref={urlRef}>{absoluteUrl}</code>
            {actionButtons}
            <div className="howto">
              <div><b>iOS</b> 단축어 → ‘URL 콘텐츠 가져오기’ → ‘배경화면 설정’, 자동화로 매일 실행</div>
              <div><b>Android</b> KWGT·배경 자동변경 앱에 URL 등록</div>
            </div>
          </section>
          <p className="toast" role="status" aria-live="polite" data-tone={toast?.tone}>{toast?.text}</p>
        </aside>
      </div>

      <footer>데이터 출처: KBO 공식(koreabaseball.com). 이 서비스는 비공식 팬 프로젝트예요.</footer>

      {sheetOpen && (
        <PreviewSheet subtitle={subtitle} ar={ar} onClose={() => setSheetOpen(false)} actions={
          <div className="sheet-actions">
            <button type="button" className="btn btn-primary" data-done={copied} onClick={copyUrl}>
              <Icon name={copied ? "check" : "copy"} size={copied ? 18 : 20} stroke={copied ? 2.4 : 2} />{copied ? "복사했어요" : "URL 복사"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={download} disabled={downloading}>
              <Icon name="download" size={20} />{downloading ? "저장 중…" : "PNG 저장"}
            </button>
          </div>
        }>
          <Screen st={st} seasonHint={seasonHint} onRetry={retry} />
        </PreviewSheet>
      )}
    </main>
  );
}
