import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/site/site-header";

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="site-frame">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
