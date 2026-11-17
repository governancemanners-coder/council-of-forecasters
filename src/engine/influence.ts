import type { ActorId } from './types';
import { ACTOR_INDEX } from './actors';

/**
 * 12×12 influence matrix. Rows = influenced, columns = influencer.
 * Canonical values — design/council.md §5. Legal Counsel has no incoming
 * edges (λ = 0): law is law.
 *
 * Seat order: board, assembly, chft, chf, city, ward, mmah, cmhc, counsel,
 * advocacy, developer, nhc.
 */
export const INFLUENCE_MATRIX: number[][] = (() => {
  const n = 12;
  const M: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const set = (influenced: ActorId, influencer: ActorId, w: number) => {
    M[ACTOR_INDEX[influenced]][ACTOR_INDEX[influencer]] = w;
  };
  // Members' Assembly
  set('assembly', 'advocacy', 0.7);
  set('assembly', 'board', 0.5);
  set('assembly', 'chft', 0.3);
  // Ward Councillor
  set('ward', 'assembly', 0.6);
  set('ward', 'advocacy', 0.5);
  set('ward', 'city', 0.3);
  // CHFT
  set('chft', 'chf', 0.5);
  set('chft', 'board', 0.3);
  set('chft', 'assembly', 0.3);
  // CHF Canada
  set('chf', 'chft', 0.5);
  set('chf', 'cmhc', 0.3);
  // City
  set('city', 'cmhc', 0.4);
  set('city', 'nhc', 0.3);
  set('city', 'advocacy', 0.3);
  // MMAH
  set('mmah', 'counsel', 0.4);
  // CMHC
  set('cmhc', 'chf', 0.3);
  set('cmhc', 'city', 0.3);
  // Board
  set('board', 'counsel', 0.6);
  set('board', 'assembly', 0.5);
  set('board', 'chft', 0.3);
  // Advocacy
  set('advocacy', 'counsel', 0.5);
  set('advocacy', 'assembly', 0.3);
  // Developer
  set('developer', 'board', 0.4);
  set('developer', 'cmhc', 0.3);
  // NHC
  set('nhc', 'advocacy', 0.3);
  // Counsel: no incoming edges.
  return M;
})();

/** All edges with weight ≥ threshold, as [influencedIdx, influencerIdx, weight]. */
export function influenceEdges(threshold = 0.4): Array<[number, number, number]> {
  const edges: Array<[number, number, number]> = [];
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      if (INFLUENCE_MATRIX[i][j] >= threshold) edges.push([i, j, INFLUENCE_MATRIX[i][j]]);
    }
  }
  return edges;
}
