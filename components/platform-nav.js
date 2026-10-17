"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Workspace",
    links: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="7" rx="2" width="7" x="3" y="3" /><rect height="7" rx="2" width="7" x="14" y="3" /><rect height="7" rx="2" width="7" x="3" y="14" /><rect height="7" rx="2" width="7" x="14" y="14" /></svg>,
      },
      {
        href: "/merchants",
        label: "Merchants",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.25" /><path d="M3.5 19.5v-1a5.5 5.5 0 0 1 11 0v1M15.5 6.2a3.3 3.3 0 0 1 0 6.3M17.2 14.2a5.1 5.1 0 0 1 3.3 4.8" /></svg>,
      },
      {
        href: "/merchant-accounts",
        label: "Stores",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9h16l-1.4-5H5.4zM5.5 9.2V20h13V9.2M8.5 20v-5h7v5" /><path d="M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0" /></svg>,
      },
    ],
  },
  {
    label: "Operations",
    links: [
      {
        label: "Plans & Billing",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6.5h14a2 2 0 0 1 2 2v10H6a2 2 0 0 1-2-2z" /><path d="M17 11h4v4h-4a2 2 0 0 1 0-4zM7 6.5V4.8h9" /></svg>,
      },
      {
        label: "Transactions",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="14" rx="2" width="18" x="3" y="5" /><path d="M3 9h18M7 15h4" /></svg>,
      },
      {
        badge: "3",
        label: "Support Tickets",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 13v-2a7 7 0 0 1 14 0v2M5 13H3v5h4v-5zM19 13h2v5h-4v-5zM17 19c-.8 1.2-2.2 2-4 2" /></svg>,
      },
      {
        label: "Bugs / Requests",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 9h8M9 5l-2-2M15 5l2-2M6 12H3M21 12h-3M7 17l-2 2M17 17l2 2" /><rect height="14" rx="5" width="10" x="7" y="5" /><path d="M9.5 12h5M12 5v14" /></svg>,
      },
    ],
  },
  {
    label: "Platform",
    links: [
      {
        label: "Analytics & Reports",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6" /></svg>,
      },
    ],
  },
  {
    label: "System",
    links: [
      {
        label: "Settings",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6v.2h-4V21A1.8 1.8 0 0 0 8.8 19.4a1.8 1.8 0 0 0-2 .4l-.1.1-2.8-2.8L4 17a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 2.8 14H2.6v-4h.2a1.8 1.8 0 0 0 1.6-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1L6.7 4l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 2.8v-.2h4v.2a1.8 1.8 0 0 0 1.1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1L20 6.7l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.1h.2v4h-.2a1.8 1.8 0 0 0-1.7 1.1z" /></svg>,
      },
      {
        label: "Users & Permissions",
        icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 7 3v5c0 4.5-2.8 8.1-7 10-4.2-1.9-7-5.5-7-10V6z" /><path d="m9.5 12 1.7 1.7 3.6-4" /></svg>,
      },
    ],
  },
];

export default function PlatformNav({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Platform navigation">
      {groups.map((group) => (
        <div className="nav-group" key={group.label}>
          <p className="nav-label">{group.label}</p>
          <div className="nav-group-links">
            {group.links.map((link) => {
              const active = link.href && (pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`)));
              const content = (
                <>
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-text">{link.label}</span>
                  {link.badge ? <span className="nav-badge">{link.badge}</span> : null}
                </>
              );

              return link.href ? (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`nav-link ${active ? "active" : ""}`}
                  href={link.href}
                  key={link.href}
                  onClick={onNavigate}
                >
                  {content}
                </Link>
              ) : (
                <span aria-disabled="true" className="nav-link nav-link-pending" key={link.label}>
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
