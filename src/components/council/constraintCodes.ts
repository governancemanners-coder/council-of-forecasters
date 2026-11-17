/**
 * Display formatter: maps an actor's canonical hard-constraint strings
 * (engine data) to short mono codes for card chips. No actor data is
 * duplicated here — this is purely a rendering concern.
 */
export function constraintCode(constraint: string): string {
  const c = constraint.toLowerCase();
  if (c.includes('residential tenancies')) return 'RTA';
  if (c.includes('human rights')) return 'HRC';
  if (c.includes('cescr')) return 'CESCR 11';
  if (c.includes('national housing strategy act')) return 'NHSA';
  if (c.includes('national housing strategy')) return 'NHS CRITERIA';
  if (c.includes('co-operative corporations act') && c.includes('fiduciary')) return 'CCA · FIDUCIARY';
  if (c.includes('co-operative corporations act')) return 'CCA';
  if (c.includes('special-resolution')) return 'SPECIAL RES.';
  if (c.includes('meeting notice')) return 'NOTICE';
  if (c.includes('bylaw')) return 'BYLAWS';
  if (c.includes('housingto')) return 'HOUSINGTO';
  if (c.includes('municipal funding')) return 'FUNDING AGT';
  if (c.includes('open doors')) return 'OPEN DOORS';
  if (c.includes('ministerial approval')) return 'MIN. APPROVAL';
  if (c.includes('program eligibility')) return 'ELIGIBILITY';
  if (c.includes('underwriting')) return 'UNDERWRITING';
  if (c.includes('fiduciary')) return 'FIDUCIARY';
  return constraint.slice(0, 14).toUpperCase();
}

/** True when the constraint string is a "none statutory" soft constraint. */
export function isSoftConstraint(constraint: string): boolean {
  return constraint.toLowerCase().startsWith('none statutory');
}
