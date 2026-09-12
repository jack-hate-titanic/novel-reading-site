"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getContinueReadingHref,
  getMostRecentBook,
  subscribeToProgressChanges,
} from "@/lib/reading-progress";

export function ContinueReadingLink({
  fallbackHref,
  fallbackLabel,
}: {
  fallbackHref: string;
  fallbackLabel: string;
}) {
  const recent = useSyncExternalStore(
    subscribeToProgressChanges,
    () => getMostRecentBook(),
    () => null,
  );

  if (recent) {
    const href = getContinueReadingHref(recent.bookSlug, recent.progress);
    return <Link href={href}>Continue Reading</Link>;
  }

  return <Link href={fallbackHref}>{fallbackLabel}</Link>;
}
