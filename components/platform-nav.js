"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="7" rx="1" width="7" x="3" y="3" /><rect height="7" rx="1" width="7" x="14" y="3" /><rect height="7" rx="1" width="7" x="3" y="14" /><rect height="7" rx="1" width="7" x="14" y="14" /></svg>,
  },
  {
    href: "/merchants",
    label: "Merchants & stores",
    icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9h16l-1-5H5zM6 9v11h12V9M9 20v-6h6v6" /><path d="M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0" /></svg>,
  },
  {
    href: "/merchant-accounts",
    label: "Merchant accounts",
    icon: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0M18 4v4M16 6h4" /></svg>,
  },
];

export default function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Platform navigation">
      {links.map((link) => (
        <Link
          className={`nav-link ${pathname === link.href ? "active" : ""}`}
          href={link.href}
          key={link.href}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
