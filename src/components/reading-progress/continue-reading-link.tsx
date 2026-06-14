"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getMostRecentBook, subscribeToProgressChanges } from "@/lib/reading-progress";

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
    const href = `/read/${recent.bookSlug}/${recent.progress.lastChapterSlug}`;
    return <Link href={href}>Continue Reading</Link>;
  }

  return <Link href={fallbackHref}>{fallbackLabel}</Link>;
}
