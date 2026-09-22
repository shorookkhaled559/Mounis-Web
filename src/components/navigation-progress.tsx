"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
  minimum: 0.1,
});

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress on route change
    NProgress.start();

    // Complete progress after a short delay (simulating page load)
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
