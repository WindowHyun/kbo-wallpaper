// 스타일 → 렌더러 디스패처
import React from "react";
import { StyleId } from "../presets";
import { RenderProps } from "./common";
import { Minimal, Mascot, Sketch, Newspaper, Brutal, Nighter, Led } from "./calendar";
import { Cute } from "./cute";
import { Bento } from "./bento";
import { Kpop } from "./kpop";
import { List } from "./list";
import { Grass, GrassSoft, Dots, Diamond } from "./season";

const RENDERERS: Record<StyleId, (p: RenderProps) => React.ReactElement> = {
  minimal: Minimal,
  cute: Cute,
  mascot: Mascot,
  sketch: Sketch,
  newspaper: Newspaper,
  brutal: Brutal,
  nighter: Nighter,
  "led-scoreboard": Led,
  "kpop-card": Kpop,
  bento: Bento,
  list: List,
  grass: Grass,
  "grass-soft": GrassSoft,
  dots: Dots,
  diamond: Diamond,
};

export function renderWallpaper(style: StyleId, props: RenderProps): React.ReactElement {
  const R = RENDERERS[style] ?? Minimal;
  return <R {...props} />;
}

export type { RenderProps };
