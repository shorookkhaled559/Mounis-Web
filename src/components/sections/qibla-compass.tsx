"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import geomagnetism from "geomagnetism";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// ── Math helpers ─────────────────────────────────────────────────────────────
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;
// signed shortest difference a - b in the range [-180, 180)
const angleDiff = (a: number, b: number) => norm360(a - b + 180) - 180;

/** Initial great-circle bearing from (lat,lng) to the Kaaba, from TRUE north. */
function calcQibla(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LNG - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return norm360(toDeg(Math.atan2(y, x)));
}

/** Magnetic declination (degrees, east positive) at a location. */
function getDeclination(lat: number, lng: number): number {
  try {
    return geomagnetism.model().point([lat, lng]).decl;
  } catch {
    return 0;
  }
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
function headingFromEuler(
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

type Status = "idle" | "loading" | "active" | "error";
type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};
type IOSDeviceOrientation = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

interface QiblaCompassProps {
  locale: string;
}

export function QiblaCompass({ locale }: QiblaCompassProps) {
  const isArabic = locale === "ar";

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [qiblaDeg, setQiblaDeg] = useState(0); // from TRUE north
  const [declination, setDeclination] = useState(0);

  // sensor state
  const [sensorOn, setSensorOn] = useState(false);
  const [hasOrientation, setHasOrientation] = useState<boolean | null>(null);
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const [dialAngle, setDialAngle] = useState(0); // accumulated CSS rotation of the dial
  const [aligned, setAligned] = useState(false);

  // Refs hold the latest values so the event listener never goes stale.
  const declinationRef = useRef(0);
  const qiblaRef = useRef(0);
  const smoothRef = useRef<{ x: number; y: number } | null>(null);
  const dialRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const alignedRef = useRef(false);

  useEffect(() => {
    declinationRef.current = declination;
    qiblaRef.current = qiblaDeg;
  }, [declination, qiblaDeg]);

  // ── Device orientation listener ──────────────────────────────────────────
  // Subscribed ONCE when sensorOn flips to true. It reads everything from refs,
  // so it never needs to be re-created (this was the original bug).
  useEffect(() => {
    if (!sensorOn) return;

    // Android Chrome exposes magnetic-north-referenced data on a separate event.
    const useAbsolute = "ondeviceorientationabsolute" in window;
    const eventName = useAbsolute ? "deviceorientationabsolute" : "deviceorientation";

    const onOrientation = (e: Event) => {
      const ev = e as IOSOrientationEvent;
      let magHeading: number | null = null;

      if (typeof ev.webkitCompassHeading === "number") {
        // iOS: already a compass heading (tilt compensated)
        magHeading = ev.webkitCompassHeading;
        const acc = ev.webkitCompassAccuracy;
        setNeedsCalibration(typeof acc === "number" && (acc < 0 || acc > 25));
      } else if (
        ev.alpha !== null && ev.beta !== null && ev.gamma !== null &&
        (ev.absolute || useAbsolute)
      ) {
        // Android: compute from Euler angles, then fix for screen rotation
        const screenAngle = window.screen?.orientation?.angle ?? 0;
        magHeading = headingFromEuler(ev.alpha, ev.beta, ev.gamma, screenAngle);
      }

      if (magHeading === null) return; // relative-only sensor → can't be trusted
      setHasOrientation(true);

      // magnetic → true north
      const trueHeading = norm360(magHeading + declinationRef.current);

      // low-pass filter on the unit circle (no 359°→0° glitch)
      const r = toRad(trueHeading);
      const k = 0.2;
      const prev = smoothRef.current ?? { x: Math.cos(r), y: Math.sin(r) };
      const sm = {
        x: prev.x + k * (Math.cos(r) - prev.x),
        y: prev.y + k * (Math.sin(r) - prev.y),
      };
      smoothRef.current = sm;
      const smoothHeading = norm360(toDeg(Math.atan2(sm.y, sm.x)));

      // throttle React updates to one per animation frame
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        // dial rotates by -heading; accumulate along the shortest path
        const target = -smoothHeading;
        dialRef.current += angleDiff(target, dialRef.current);
        setDialAngle(dialRef.current);

        const isAligned = Math.abs(angleDiff(qiblaRef.current, smoothHeading)) <= 3;
        if (isAligned !== alignedRef.current) {
          alignedRef.current = isAligned;
          setAligned(isAligned);
          if (isAligned && "vibrate" in navigator) navigator.vibrate(60);
        }
      });
    };

    window.addEventListener(eventName, onOrientation, true);
    // no data after 1.5s → no usable sensor (desktop / unsupported)
    const timer = setTimeout(() => setHasOrientation((p) => (p === null ? false : p)), 1500);

    return () => {
      window.removeEventListener(eventName, onOrientation, true);
      clearTimeout(timer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [sensorOn]);

  // ── Click handler: permission FIRST (iOS needs a direct user gesture) ──────
  const requestLocation = useCallback(async () => {
    // 1) iOS 13+: requestPermission must be called synchronously inside the click,
    //    BEFORE any other await / callback, otherwise Safari rejects it.
    const DevOri = (typeof DeviceOrientationEvent !== "undefined"
      ? DeviceOrientationEvent
      : undefined) as unknown as IOSDeviceOrientation | undefined;

    let sensorAllowed = true;
    if (DevOri && typeof DevOri.requestPermission === "function") {
      try {
        sensorAllowed = (await DevOri.requestPermission()) === "granted";
      } catch {
        sensorAllowed = false;
      }
    }

    // 2) Location
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg(isArabic ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation not supported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const deg = calcQibla(coords.latitude, coords.longitude);
        const decl = getDeclination(coords.latitude, coords.longitude);
        declinationRef.current = decl;
        qiblaRef.current = deg;
        setDeclination(decl);
        setQiblaDeg(deg);
        setStatus("active");
        if (sensorAllowed) {
          setHasOrientation(null);
          setSensorOn(true);
        } else {
          setHasOrientation(false);
        }
      },
      (err) => {
        setStatus("error");
        setErrorMsg(
          err.code === 1
            ? isArabic
              ? "تم رفض الإذن. يرجى السماح بالوصول للموقع."
              : "Permission denied. Please allow location access."
            : isArabic
            ? "تعذّر تحديد موقعك، حاول مرة أخرى."
            : "Could not get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [isArabic]);

  // ── Geometry ──────────────────────────────────────────────────────────────
  // The whole dial (ticks, N/E/S/W, Kaaba marker) rotates by -heading, so "N"
  // always points to real north. The Kaaba marker sits on the dial at qiblaDeg.
  // The fixed pointer at the top of the screen = where the phone is facing.
  // When the Kaaba marker reaches the top pointer → you are facing the Qibla.
  // how many degrees you still need to turn: + = right, - = left
  const turnBy = angleDiff(qiblaDeg, norm360(-dialAngle));
  const kaabaAngleRad = toRad(qiblaDeg);
  const kaabaR = 100;
  const kaabaX = 128 + kaabaR * Math.sin(kaabaAngleRad);
  const kaabaY = 128 - kaabaR * Math.cos(kaabaAngleRad);

  // Tick marks
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isMajor = i % 5 === 0;
    const angle = (i * 6 * Math.PI) / 180;
    const r1 = isMajor ? 108 : 113;
    const r2 = 120;
    return { angle, isMajor, r1, r2 };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="12,2 14.5,9.5 12,8 9.5,9.5" fill="currentColor" stroke="none" />
            <polygon points="12,22 14.5,14.5 12,16 9.5,14.5" fill="#ccc" stroke="none" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {isArabic ? "اتجاه القبلة" : "Qibla Direction"}
          </h2>
          <p className="text-xs text-ink-muted">
            {isArabic
              ? "حدد موقعك وحرّك جهازك نحو القبلة"
              : "Set your location and rotate toward Qibla"}
          </p>
        </div>
      </div>

      {/* Compass */}
      <div className="flex flex-col items-center gap-3 flex-1 justify-center" dir="ltr">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 256 256" className="w-full h-full">

            {/* Outer ring (fixed) */}
            <circle cx="128" cy="128" r="122" fill="none"
              stroke={aligned ? "#2e7d32" : "#4f9d2f"} strokeWidth="8" />
            <circle cx="128" cy="128" r="118" fill="white" />

            {/* ── Rotating dial ── */}
            <g
              style={{
                transformOrigin: "128px 128px",
                transform: `rotate(${dialAngle}deg)`,
                transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {/* Subtle wind-rose */}
              {[0, 45, 90, 135].map((a) => {
                const rad = toRad(a);
                return (
                  <line key={a}
                    x1={128 + 90 * Math.sin(rad)} y1={128 - 90 * Math.cos(rad)}
                    x2={128 - 90 * Math.sin(rad)} y2={128 + 90 * Math.cos(rad)}
                    stroke="#e8f3df" strokeWidth="1"
                  />
                );
              })}

              {/* Tick marks */}
              {ticks.map(({ angle, isMajor, r1, r2 }, i) => (
                <line key={i}
                  x1={128 + r2 * Math.sin(angle)} y1={128 - r2 * Math.cos(angle)}
                  x2={128 + r1 * Math.sin(angle)} y2={128 - r1 * Math.cos(angle)}
                  stroke={isMajor ? "#4f9d2f" : "#dce5d8"}
                  strokeWidth={isMajor ? 2 : 1}
                />
              ))}

              {/* Cardinal letters (counter-rotated so they stay readable) */}
              {[
                { label: "N", dx: 0,   dy: -88, color: "#e53935" },
                { label: "S", dx: 0,   dy:  88, color: "#18321f" },
                { label: "W", dx: -88, dy:   0, color: "#18321f" },
                { label: "E", dx: 88,  dy:   0, color: "#18321f" },
              ].map(({ label, dx, dy, color }) => (
                <text key={label}
                  x={128 + dx} y={128 + dy}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="12" fontWeight="700" fill={color}
                  transform={`rotate(${-dialAngle} ${128 + dx} ${128 + dy})`}
                >
                  {label}
                </text>
              ))}

              {status === "active" && (
                <>
                  {/* Big arrow pointing to the Kaaba (rotates with the dial) */}
                  <g
                    style={{
                      transformOrigin: "128px 128px",
                      transform: `rotate(${qiblaDeg}deg)`,
                    }}
                  >
                    <polygon
                      points="128,52 144,92 134,92 134,128 122,128 122,92 112,92"
                      fill={aligned ? "#2e7d32" : "#e53935"}
                      opacity="0.9"
                    >
                      {!aligned && (
                        <animate attributeName="opacity" values="0.95;0.55;0.95"
                          dur="1.6s" repeatCount="indefinite" />
                      )}
                    </polygon>
                  </g>
                  {/* Kaaba icon (upright regardless of dial rotation) */}
                  <g transform={`translate(${kaabaX}, ${kaabaY}) rotate(${-dialAngle}) translate(-12, -12)`}
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                  >
                    <rect x="0" y="4" width="24" height="18" rx="1" fill="#1a1a2e" />
                    <rect x="0" y="4" width="24" height="5" fill="#2d2d4e" />
                    <rect x="0" y="8" width="24" height="2" fill="#c8a951" />
                    <rect x="8" y="14" width="8" height="8" rx="1" fill="#c8a951" />
                    <rect x="9" y="15" width="6" height="7" rx="0.5" fill="#8b6914" />
                    <rect x="0" y="0" width="24" height="5" rx="1" fill="#111" opacity="0.7" />
                  </g>
                </>
              )}
            </g>

            {aligned && (
              <circle cx="128" cy="128" r="118" fill="none" stroke="#2e7d32" strokeWidth="3">
                <animate attributeName="r" values="118;126;118" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* ── Fixed pointer = where the phone is facing ── */}
            <polygon
              points="128,8 119,28 137,28"
              fill={aligned ? "#2e7d32" : status === "active" ? "#e53935" : "#cccccc"}
            />
            <circle cx="128" cy="128" r="5" fill="white"
              stroke={aligned ? "#2e7d32" : "#4f9d2f"} strokeWidth="2" />
          </svg>

          {/* Loading overlay */}
          {status === "loading" && (
            <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Status text */}
        <div className="text-center min-h-[2.5rem]">
          {status === "active" && (
            <>
              <p className="font-display text-3xl font-bold text-ink">{Math.round(qiblaDeg)}°</p>
              {hasOrientation === false && (
                <p className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                  <span>⚠️</span>
                  {isArabic
                    ? "مفيش حساس بوصلة متاح (جرّب من موبايل وعلى HTTPS) — الاتجاه ثابت من الشمال"
                    : "No compass sensor available (use a phone over HTTPS) — direction is fixed from North"}
                </p>
              )}
              {hasOrientation === true && aligned && (
                <p className="text-sm font-semibold text-green-700 mt-1">
                  {isArabic ? "✓ أنت في اتجاه القبلة" : "✓ You are facing the Qibla"}
                </p>
              )}
              {hasOrientation === true && !aligned && (
                <p className="text-sm font-semibold text-primary mt-1 flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {turnBy > 0
                    ? isArabic
                      ? `لفّي يمين ${Math.round(Math.abs(turnBy))}° ➜`
                      : `Turn right ${Math.round(Math.abs(turnBy))}° ➜`
                    : isArabic
                    ? `⬅ لفّي شمال ${Math.round(Math.abs(turnBy))}°`
                    : `⬅ Turn left ${Math.round(Math.abs(turnBy))}°`}
                </p>
              )}
              {needsCalibration && (
                <p className="text-xs text-amber-600 mt-1">
                  {isArabic
                    ? "البوصلة محتاجة معايرة: حرّك الموبايل على شكل رقم 8"
                    : "Calibrate: move your phone in a figure-8 motion"}
                </p>
              )}
            </>
          )}
          {status === "idle" && (
            <p className="text-sm text-ink-muted">
              {isArabic ? "اضغط الزر أدناه لتحديد اتجاه القبلة" : "Press the button to find Qibla direction"}
            </p>
          )}
          {status === "loading" && (
            <p className="text-sm text-ink-muted">
              {isArabic ? "جاري تحديد موقعك..." : "Getting your location..."}
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-500 flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={requestLocation}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-deep active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        {status === "active"
          ? isArabic ? "تحديث الموقع" : "Update Location"
          : isArabic ? "استخدام موقعي الحالي" : "Use My Current Location"}
      </button>

      <p className="text-center text-xs text-ink-muted">
        <button className="text-primary hover:underline inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {isArabic ? "أو اختر موقعك يدوياً" : "Or choose location manually"}
        </button>
      </p>
    </div>
  );
}