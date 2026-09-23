"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function calcQibla(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

type Status = "idle" | "loading" | "active" | "error";

interface QiblaCompassProps {
  locale: string;
}

export function QiblaCompass({ locale }: QiblaCompassProps) {
  const isArabic = locale === "ar";

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [qiblaDeg, setQiblaDeg] = useState(0);

  // Smoothed needle angle (accumulated to avoid wrap-around jumps)
  const needleRef = useRef(0);
  const [displayAngle, setDisplayAngle] = useState(0);

  // ── DeviceOrientation ──────────────────────────────────────────────────────
  const [hasOrientation, setHasOrientation] = useState<boolean | null>(null);

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      const raw =
        (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
          .webkitCompassHeading ??
        (e.alpha !== null ? (360 - e.alpha) % 360 : null);

      if (raw === null) return;
      setHasOrientation(true);

      // Direction the needle should point = qibla bearing − device heading
      const target = qiblaDeg - raw;

      // Shortest-path: keep accumulated angle within ±180° of previous
      let diff = ((target - needleRef.current) % 360 + 540) % 360 - 180;
      needleRef.current = needleRef.current + diff;
      setDisplayAngle(needleRef.current);
    },
    [qiblaDeg]
  );

  const startOrientation = useCallback(async () => {
    const DevOri = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DevOri.requestPermission === "function") {
      const perm = await DevOri.requestPermission();
      if (perm !== "granted") return;
    }
    window.addEventListener("deviceorientation", handleOrientation, true);
    // After 1 second, if no orientation data received → device has no sensor
    setTimeout(() => {
      setHasOrientation((prev) => (prev === null ? false : prev));
    }, 1000);
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation]);

  // ── Geolocation ────────────────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg(
        isArabic
          ? "المتصفح لا يدعم تحديد الموقع"
          : "Geolocation not supported"
      );
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const deg = calcQibla(coords.latitude, coords.longitude);
        setQiblaDeg(Math.round(deg));
        // Set initial static needle before orientation kicks in
        needleRef.current = deg;
        setDisplayAngle(deg);
        setStatus("active");
        startOrientation();
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
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isArabic, startOrientation]);

  // ── Compass ring: 12 tick marks like a clock ───────────────────────────────
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isMajor = i % 5 === 0;
    const angle = (i * 6 * Math.PI) / 180;
    const r1 = isMajor ? 108 : 113;
    const r2 = 120;
    return { angle, isMajor, r1, r2 };
  });

  // Kaaba position on ring edge (top = 0°, clockwise)
  const kaabaAngle = ((displayAngle) * Math.PI) / 180;
  const kaabaR = 108;
  const kaabaX = 128 + kaabaR * Math.sin(kaabaAngle);
  const kaabaY = 128 - kaabaR * Math.cos(kaabaAngle);

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

            {/* Outer green ring */}
            <circle cx="128" cy="128" r="122" fill="none" stroke="#4f9d2f" strokeWidth="8" />

            {/* Inner white fill */}
            <circle cx="128" cy="128" r="118" fill="white" />

            {/* Subtle star/wind-rose in background */}
            {[0, 45, 90, 135].map((a) => {
              const rad = (a * Math.PI) / 180;
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

            {/* Cardinal letters */}
            {[
              { label: "N", dx: 0,    dy: -94 },
              { label: "S", dx: 0,    dy:  98 },
              { label: "W", dx: -96,  dy:   4 },
              { label: "E", dx:  96,  dy:   4 },
            ].map(({ label, dx, dy }) => (
              <text key={label}
                x={128 + dx} y={128 + dy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight="700" fill="#18321f"
              >
                {label}
              </text>
            ))}

            {/* ── Needle ── */}
            <g
              style={{
                transformOrigin: "128px 128px",
                transform: `rotate(${displayAngle}deg)`,
                transition: "transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
            >
              {/* Red north tip */}
              <polygon
                points="128,42 122,128 134,128"
                fill={status === "active" ? "#e53935" : "#cccccc"}
              />
              {/* Light south tip */}
              <polygon
                points="128,214 122,128 134,128"
                fill={status === "active" ? "#ef9a9a" : "#e0e0e0"}
              />
              {/* Center cap */}
              <circle cx="128" cy="128" r="6"
                fill="white" stroke={status === "active" ? "#e53935" : "#cccccc"} strokeWidth="2"
              />

              {/* Dashed line from center to Kaaba icon position */}
              {status === "active" && (
                <line
                  x1="128" y1="128"
                  x2={kaabaX} y2={kaabaY}
                  stroke="#e53935" strokeWidth="1.5"
                  strokeDasharray="4 3" opacity="0.6"
                />
              )}
            </g>

            {/* ── Kaaba icon on ring edge ── */}
            {status === "active" && (
              <g transform={`translate(${kaabaX - 12}, ${kaabaY - 12})`}
                style={{
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                  transition: "all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",
                }}
              >
                {/* Kaaba body */}
                <rect x="0" y="4" width="24" height="18" rx="1" fill="#1a1a2e" />
                <rect x="0" y="4" width="24" height="5" fill="#2d2d4e" />
                <rect x="0" y="8" width="24" height="2" fill="#c8a951" />
                {/* Door */}
                <rect x="8" y="14" width="8" height="8" rx="1" fill="#c8a951" />
                <rect x="9" y="15" width="6" height="7" rx="0.5" fill="#8b6914" />
                {/* Black drape top */}
                <rect x="0" y="0" width="24" height="5" rx="1" fill="#111" opacity="0.7"/>
              </g>
            )}
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
              <p className="font-display text-3xl font-bold text-ink">{qiblaDeg}°</p>
              {hasOrientation === false && (
                <p className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                  <span>⚠️</span>
                  {isArabic
                    ? "جهازك لا يدعم البوصلة — الاتجاه ثابت من الشمال"
                    : "No compass sensor — direction is fixed from North"}
                </p>
              )}
              {hasOrientation === true && (
                <p className="text-xs text-primary mt-1 flex items-center justify-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {isArabic ? "البوصلة تعمل — حرّك جهازك" : "Live compass — rotate your device"}
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
