import Link from "next/link";

const navItems = [
  { href: "/", label: "Library" },
  { href: "/read/half-demon-si-teng/chapter-1", label: "Continue Reading" },
  { href: "/#reading-mode", label: "About Reading Mode" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        Novel Reading Site
      </Link>
      <nav className="site-nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
