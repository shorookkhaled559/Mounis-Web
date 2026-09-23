"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr:false must live inside a Client Component.
// This thin wrapper lets the Server-Component layout lazy-load NavigationProgress
// without shipping nprogress to the initial bundle.
const NavigationProgress = dynamic(
  () => import("./navigation-progress").then((m) => m.NavigationProgress),
  { ssr: false }
);

export function NavigationProgressLoader() {
  return <NavigationProgress />;
}
