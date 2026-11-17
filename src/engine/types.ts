/**
 * Council of Forecasters — engine types.
 * Canonical axis order for all vectors: [AFF, AUT, FND, INT, DEM, NME, RGT, CLM]
 */

export type PolicyAxis = 'AFF' | 'AUT' | 'FND' | 'INT' | 'DEM' | 'NME' | 'RGT' | 'CLM';

export const AXIS_ORDER: readonly PolicyAxis[] = [
  'AFF', 'AUT', 'FND', 'INT', 'DEM', 'NME', 'RGT', 'CLM',
] as const;

export const AXIS_NAMES: Record<PolicyAxis, string> = {
  AFF: 'Affordability depth',
  AUT: 'Co-op autonomy',
  FND: 'Public funding reliance',
  INT: 'Intensification appetite',
  DEM: 'Member democratic control',
  NME: 'Non-market expansion',
  RGT: 'Member rights',
  CLM: 'Climate retrofits',
};

export const AXIS_DEFS: Record<PolicyAxis, string> = {
  AFF: 'deep affordability vs. cost recovery',
  AUT: 'self-governance vs. regulatory oversight',
  FND: 'grants & subsidies vs. self-financing',
  INT: 'new development & density',
  DEM: 'one member, one vote',
  NME: 'growing the non-market stock',
  RGT: 'eviction protection & due process',
  CLM: 'building renewal & decarbonization',
};

/** Fixed-length vector over the 8 policy axes. */
export type Vector8 = [number, number, number, number, number, number, number, number];

export type ActorId =
  | 'board'
  | 'assembly'
  | 'chft'
  | 'chf'
  | 'city'
  | 'ward'
  | 'mmah'
  | 'cmhc'
  | 'counsel'
  | 'advocacy'
  | 'developer'
  | 'nhc';

export type OrgType =
  | 'governance'
  | 'sector'
  | 'government'
  | 'funder'
  | 'legal'
  | 'advocacy'
  | 'market'
  | 'rights';

export type StanceBucket = 'support' | 'oppose' | 'cautious';

export interface ActorQA {
  /** Q: What would make you support this? */
  support: string;
  /** Q: What's your hard limit? */
  limit: string;
}

export interface Actor {
  id: ActorId;
  seat: number;
  name: string;
  shortName: string;
  monogram: string;
  orgType: OrgType;
  orgLabel: string;
  /** One-line persona (italic voice). */
  persona: string;
  /** Description paragraph. */
  bio: string;
  /** Preference weights over AXIS_ORDER, range −3..+3. */
  weights: Vector8;
  /** How much this seat cares about housing-co-op actions (0–1). */
  salience: number;
  /** How much this seat moves others (0–1). */
  influence: number;
  /** Cascade susceptibility λ (0–1). 0 = immune. */
  lambda: number;
  hardConstraints: string[];
  policyOptions: string[];
  voice: Record<StanceBucket, [string, string, string]>;
  qa: ActorQA;
  isVetoChair?: boolean;
}

export type CategoryId =
  | 'refinancing'
  | 'intensification'
  | 'charge-increase'
  | 'governance'
  | 'eviction'
  | 'retrofit'
  | 'occupancy'
  | 'disposition';

export interface ActionCategory {
  id: CategoryId;
  label: string;
  base: Vector8;
}

export interface Sliders {
  /** FINANCIAL SCALE — scales FND, AFF */
  financial: number;
  /** MEMBER IMPACT — scales DEM, RGT, AFF */
  member: number;
  /** REGULATORY EXPOSURE — scales AUT, RGT */
  regulatory: number;
  /** TIMELINE URGENCY — scales all components */
  timeline: number;
}

export interface ScenarioSeed {
  text: string;
  categoryId: CategoryId;
  sliders: Sliders;
}

export type ConstraintStatus = 'clear' | 'at-risk' | 'violated';

export interface ConstraintCheck {
  framework: string;
  short: string;
  status: ConstraintStatus;
  basis: string;
}

export interface VetoInfo {
  statute: string;
  clause: string;
  ceiling: 'BLOCKED';
}

export type MessageKind = 'chat' | 'veto' | 'system';

export interface ChatMessage {
  id: string;
  kind: MessageKind;
  actorId: ActorId | null;
  round: number;
  text: string;
  bucket: StanceBucket | null;
  /** Stance after this round (−1..+1). */
  stance: number;
  /** Change vs. previous round. */
  delta: number;
  /** Cross-talk tag, e.g. REACTS TO LEGAL COUNSEL. */
  tag?: string;
  veto?: VetoInfo;
}

export const ROUND_NAMES = [
  'FIRST READINGS',
  'INFLUENCE CASCADE',
  'POSITIONS HARDEN',
  'FINAL POSITIONS',
] as const;

export interface RoundState {
  round: number; // 1..4
  name: string;
  /** Stances by actor index (0..11, seat order). */
  stances: number[];
  messages: ChatMessage[];
}

export type VerdictKey = 'blocked' | 'unlikely' | 'contested' | 'likely' | 'mandate';

export interface VerdictBand {
  key: VerdictKey;
  label: string;
  word: string;
  range: [number, number];
  meaning: string;
  posture: string;
}

export interface BlocEntry {
  actorId: ActorId;
  stance: number;
  reason: string;
}

export interface Persuadable {
  actorId: ActorId;
  stance: number;
  flipCondition: string;
  projected: number;
}

export interface SequenceStop {
  actorId: ActorId;
  action: string;
  rationale: string;
}

export interface ForecastResult {
  seedHash: string;
  band: VerdictBand;
  /** Point probability (0–100) inside the band. */
  probability: number;
  veto: VetoInfo | null;
  summary: string;
  allies: BlocEntry[];
  middle: Persuadable[];
  bloc: BlocEntry[];
  sequencing: SequenceStop[];
  checklist: ConstraintCheck[];
  finalStances: number[];
}

export interface SimulationRun {
  seed: ScenarioSeed;
  seedHash: string;
  actionVector: Vector8;
  initialStances: number[];
  rounds: RoundState[];
  checklist: ConstraintCheck[];
  veto: VetoInfo | null;
  forecast: ForecastResult;
}

export type SimPhase = 'idle' | 'seeding' | 'running' | 'report';
