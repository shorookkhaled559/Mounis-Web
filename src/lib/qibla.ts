// Pure compass / Qibla math (no React, no browser APIs) so it can be unit tested.

// Kaaba coordinates
export const KAABA_LAT = 21.4225;
export const KAABA_LNG = 39.8262;

// ── Math helpers ─────────────────────────────────────────────────────────────
export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;
export const norm360 = (d: number) => ((d % 360) + 360) % 360;
// signed shortest difference a - b in the range [-180, 180)
export const angleDiff = (a: number, b: number) => norm360(a - b + 180) - 180;

/** Initial great-circle bearing from (lat,lng) to the Kaaba, from TRUE north. */
export function calcQibla(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LNG - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return norm360(toDeg(Math.atan2(y, x)));
}

/**
 * Compass heading (clockwise from north, 0-360) from alpha/beta/gamma.
 *
 * The classic W3C formula gives the direction the BACK of the phone points to,
 * and breaks (returns 0) when the phone is flat. A compass is usually held flat
 * or tilted, so we compute both:
 *   - "top edge" direction  → good when the phone is flat / slightly tilted
 *   - "back camera" direction → good when the phone is held upright
 * and use whichever has the bigger horizontal component (they agree in between).
 */
export function headingFromEuler(
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle: number
): number {
  const a = toRad(alpha);
  const b = toRad(beta);
  const g = toRad(gamma);
  const cA = Math.cos(a), sA = Math.sin(a);
  const cB = Math.cos(b), sB = Math.sin(b);
  const cG = Math.cos(g), sG = Math.sin(g);

  // device +Y axis (top edge) projected on the ground: (East, North)
  const topE = -cB * sA;
  const topN = cA * cB;
  // device -Z axis (back of the phone) projected on the ground
  const backE = -(cA * sG + cG * sA * sB);
  const backN = -(sA * sG - cA * cG * sB);

  if (Math.hypot(topE, topN) >= Math.hypot(backE, backN)) {
    // flat mode: the "forward" direction is the top of the SCREEN, which depends
    // on whether the phone is in portrait or landscape
    return norm360(toDeg(Math.atan2(topE, topN)) + screenAngle);
  }
  return norm360(toDeg(Math.atan2(backE, backN)));
}
