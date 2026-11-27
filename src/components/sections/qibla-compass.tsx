"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import geomagnetism from "geomagnetism";
import { angleDiff, calcQibla, headingFromEuler, norm360, toDeg, toRad } from "@/lib/qibla";
import { PrayerCard, CardHeading } from "./prayer-card";

/** Magnetic declination (degrees, east positive) at a location. */
function getDeclination(lat: number, lng: number): number {
  try {
    return geomagnetism.model().point([lat, lng]).decl;
  } catch {
    return 0;
  }
}

type Status = "idle" | "loading" | "error";
type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};
type IOSDeviceOrientation = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

interface QiblaCompassProps {
  /** the currently selected location (city or GPS) */
  lat: number;
  lng: number;
  /** called with the device position after the user taps "use my location" */
  onLocate: (lat: number, lng: number) => void;
}

export function QiblaCompass({ lat, lng, onLocate }: QiblaCompassProps) {
  const t = useTranslations("prayerPage");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // The bearing is known from the selected location straight away; the sensor
  // only adds the live rotation.
  const qiblaDeg = useMemo(() => calcQibla(lat, lng), [lat, lng]);
  const declination = useMemo(() => getDeclination(lat, lng), [lat, lng]);

  // sensor state
  const [sensorOn, setSensorOn] = useState(false);
  const [hasOrientation, setHasOrientation] = useState<boolean | null>(null);
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const [dialAngle, setDialAngle] = useState(0); // accumulated CSS rotation of the dial
  const [aligned, setAligned] = useState(false);

  // Refs hold the latest values so the event listener never goes stale.
  const declinationRef = useRef(declination);
  const qiblaRef = useRef(qiblaDeg);
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
  // so it never needs to be re-created.
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
      setErrorMsg(t("geoUnsupported"));
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // refs first so the very next sensor event already uses the new bearing
        qiblaRef.current = calcQibla(coords.latitude, coords.longitude);
        declinationRef.current = getDeclination(coords.latitude, coords.longitude);
        onLocate(coords.latitude, coords.longitude);
        setStatus("idle");
        setErrorMsg("");
        if (sensorAllowed) {
          setHasOrientation(null);
          setSensorOn(true);
        } else {
          setHasOrientation(false);
        }
      },
      (err) => {
        setStatus("error");
        setErrorMsg(err.code === 1 ? t("geoDenied") : t("geoFailed"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [t, onLocate]);

  // ── Geometry ──────────────────────────────────────────────────────────────
  // The whole dial (ticks, N/E/S/W, arrow) rotates by -heading, so "N" always
  // points to real north. The arrow sits on the dial at qiblaDeg. The fixed
  // pointer at the top = where the phone is facing. Arrow under the pointer →
  // you are facing the Qibla.
  // how many degrees you still need to turn: + = right, - = left
  const turnBy = angleDiff(qiblaDeg, norm360(-dialAngle));

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const isMajor = i % 6 === 0;
    const angle = (i * 5 * Math.PI) / 180;
    return { angle, isMajor, r1: isMajor ? 108 : 113, r2: 118 };
  });

  const ring = aligned ? "#2e7d32" : "var(--primary)";
  const arrow = aligned ? "#2e7d32" : "var(--primary)";

  return (
    <PrayerCard className="flex h-full flex-col gap-5 p-6">
      <CardHeading
        icon={
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="m15.5 8.5-2 5-5 2 2-5z" />
          </svg>
        }
        title={t("qiblaTitle")}
        subtitle={t("qiblaSubtitle")}
      />

      {/* Compass */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3" dir="ltr">
        <div className="relative aspect-square w-full max-w-[15rem]">
          <svg viewBox="0 0 256 256" className="h-full w-full" role="img" aria-label={t("compassAria")}>
            <circle cx="128" cy="128" r="124" fill="var(--surface)" stroke={ring} strokeWidth="5" />
            <circle cx="128" cy="128" r="119" fill="none" stroke="var(--border)" strokeWidth="1" />

            {/* ── Rotating dial ── */}
            <g
              style={{
                transformOrigin: "128px 128px",
                transform: `rotate(${dialAngle}deg)`,
                transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {ticks.map(({ angle, isMajor, r1, r2 }, i) => (
                <line key={i}
                  x1={128 + r2 * Math.sin(angle)} y1={128 - r2 * Math.cos(angle)}
                  x2={128 + r1 * Math.sin(angle)} y2={128 - r1 * Math.cos(angle)}
                  stroke={isMajor ? "var(--primary)" : "var(--border)"}
                  strokeWidth={isMajor ? 1.6 : 1}
                />
              ))}

              {/* Cardinal letters (counter-rotated so they stay readable) */}
              {[
                { label: t("dirN"), dx: 0,   dy: -92, color: "#e53935" },
                { label: t("dirS"), dx: 0,   dy:  92, color: "var(--ink)" },
                { label: t("dirW"), dx: -92, dy:   0, color: "var(--ink)" },
                { label: t("dirE"), dx: 92,  dy:   0, color: "var(--ink)" },
              ].map(({ label, dx, dy, color }) => (
                <text key={dy + "," + dx}
                  x={128 + dx} y={128 + dy}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="13" fontWeight="700" fill={color}
                  transform={`rotate(${-dialAngle} ${128 + dx} ${128 + dy})`}
                >
                  {label}
                </text>
              ))}

              {/* Arrow toward the Kaaba (rotates with the dial) */}
              <g style={{ transformOrigin: "128px 128px", transform: `rotate(${qiblaDeg}deg)` }}>
                <polygon points="128,46 142,92 128,84 114,92" fill={arrow} />
                <rect x="126" y="84" width="4" height="22" rx="2" fill={arrow} />
              </g>
            </g>

            {/* Kaaba (centre, always upright) */}
            <g transform="translate(110 110)">
              <rect x="1" y="3" width="34" height="32" rx="3" fill="#111" />
              <rect x="1" y="3" width="34" height="9" rx="3" fill="#2a2a2a" />
              <rect x="1" y="14" width="34" height="4" fill="#c8a951" />
              <rect x="12" y="22" width="12" height="13" rx="1.5" fill="#c8a951" />
              <rect x="14" y="24" width="8" height="11" rx="1" fill="#8b6914" />
            </g>

            {aligned && (
              <circle cx="128" cy="128" r="119" fill="none" stroke="#2e7d32" strokeWidth="3">
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Fixed pointer = where the phone is facing */}
            {sensorOn && hasOrientation && (
              <polygon points="128,6 121,20 135,20" fill={aligned ? "#2e7d32" : "#e53935"} />
            )}
          </svg>

          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-surface/70">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Live guidance */}
        <div className="min-h-[1.25rem] text-center" dir="auto" aria-live="polite">
          {status === "loading" && <p className="text-xs text-ink-muted">{t("geoLoading")}</p>}
          {status === "error" && (
            <p className="flex items-center justify-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errorMsg}
            </p>
          )}
          {status === "idle" && sensorOn && hasOrientation === false && (
            <p className="text-xs text-amber-600">{t("noSensor")}</p>
          )}
          {status === "idle" && hasOrientation === true && aligned && (
            <p className="text-sm font-semibold text-green-700">✓ {t("aligned")}</p>
          )}
          {status === "idle" && hasOrientation === true && !aligned && (
            <p className="text-sm font-semibold text-primary">
              {turnBy > 0 ? t("turnRight", { deg: Math.round(Math.abs(turnBy)) }) : t("turnLeft", { deg: Math.round(Math.abs(turnBy)) })}
            </p>
          )}
          {needsCalibration && <p className="mt-1 text-xs text-amber-600">{t("calibrate")}</p>}
        </div>
      </div>

      {/* Bearing from the selected location */}
      <div className="rounded-2xl bg-surface-raised px-4 py-3 text-center">
        <p className="text-xs text-ink-muted">{t("qiblaFromHere")}</p>
        <p className="font-display text-2xl font-bold tabular-nums text-ink" dir="ltr">
          {Math.round(qiblaDeg)}°
        </p>
      </div>

      <button
        type="button"
        onClick={requestLocation}
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-subtle active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {sensorOn ? t("updateMyLocation") : t("useMyLocation")}
      </button>
    </PrayerCard>
  );
}
