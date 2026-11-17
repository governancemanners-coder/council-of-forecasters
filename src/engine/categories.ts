import type { ActionCategory, CategoryId, Sliders, Vector8 } from './types';
import { AXIS_ORDER } from './types';

/**
 * The eight action categories and their base vectors over
 * [AFF, AUT, FND, INT, DEM, NME, RGT, CLM].
 * Canonical data — design/simulator.md, Pane 1.
 */
export const CATEGORIES: ActionCategory[] = [
  { id: 'refinancing', label: 'Refinancing / mortgage renewal', base: [0, 0.2, 0.6, 0, 0, 0, 0, 0.2] },
  { id: 'intensification', label: 'Intensification / dev partnership', base: [-0.2, -0.4, -0.4, 1.0, -0.4, -0.2, -0.3, 0.1] },
  { id: 'charge-increase', label: 'Housing charge increase', base: [-0.8, 0.3, -0.3, 0, -0.2, 0, -0.5, 0] },
  { id: 'governance', label: 'Governance & bylaw reform', base: [0, 0.4, 0, 0, 0.8, 0, 0.2, 0] },
  { id: 'eviction', label: 'Eviction / arrears enforcement', base: [-0.6, 0.2, 0, 0, -0.4, 0, -1.0, 0] },
  { id: 'retrofit', label: 'Capital retrofit & climate program', base: [0.2, 0, 0.4, 0.2, 0.1, 0, 0, 1.0] },
  { id: 'occupancy', label: 'Member intake & occupancy policy', base: [0.5, 0.2, 0, 0, 0.3, 0.5, 0.3, 0] },
  { id: 'disposition', label: 'Asset sale / disposition', base: [-0.7, -0.2, -0.5, 0.3, -0.5, -0.8, -0.4, 0] },
];

export const CATEGORY_BY_ID: Record<CategoryId, ActionCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, ActionCategory>;

/** Slider value 0–100 → scalar 0.5–1.5× (linear, 50 → 1.0). */
export function sliderScalar(v: number): number {
  return 0.5 + Math.min(100, Math.max(0, v)) / 100;
}

/**
 * Compose the action vector: category base × slider scalars.
 * FINANCIAL → FND, AFF · MEMBER → DEM, RGT, AFF · REGULATORY → AUT, RGT · TIMELINE → all.
 */
export function computeActionVector(categoryId: CategoryId, sliders: Sliders): Vector8 {
  const base = CATEGORY_BY_ID[categoryId].base;
  const fin = sliderScalar(sliders.financial);
  const mem = sliderScalar(sliders.member);
  const reg = sliderScalar(sliders.regulatory);
  const time = sliderScalar(sliders.timeline);
  const scale: Record<(typeof AXIS_ORDER)[number], number> = {
    AFF: fin * mem * time,
    AUT: reg * time,
    FND: fin * time,
    INT: time,
    DEM: mem * time,
    NME: time,
    RGT: mem * reg * time,
    CLM: time,
  };
  return AXIS_ORDER.map((ax, i) => base[i] * scale[ax]) as Vector8;
}

/** True when the seed text signals member consultation / a member vote. */
export function hasMemberVoteWording(text: string): boolean {
  return /members['’]?\s+(vote|meeting|resolution|approval)|special resolution|town hall|member vote|ratif/i.test(
    text,
  );
}

/** The sample seed used by "Load a sample seed" and the Home teaser. */
export const SAMPLE_SEED = {
  text: 'Partner with a developer to build a 6-storey rental addition on our parking lot, with proceeds funding deep energy retrofits — subject to a members’ special resolution at a town hall.',
  categoryId: 'intensification' as CategoryId,
  sliders: { financial: 65, member: 55, regulatory: 45, timeline: 50 },
};
