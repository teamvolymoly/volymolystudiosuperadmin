"use client";

import { usePathname } from "next/navigation";
import LogoutButton from "../features/auth/components/logout-button";

const titles = {
  "/dashboard": ["Dashboard", "Overview of your platform workspace"],
  "/merchants": ["Organizations & stores", "Manage the businesses operating on Volymoly"],
  "/merchant-accounts": ["Merchant accounts", "Manage merchant identities and access"],
};

export default function PlatformHeader({ adminName }) {
  const pathname = usePathname();
  const [title, description] = titles[pathname] || ["Platform control", "Volymoly Super Admin"];

  return (
    <header className="topbar">
      <div className="topbar-copy">
        <span className="topbar-label">Volymoly Super Admin</span>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
      <div className="topbar-actions">
        <span className="topbar-status"><i /> Secure session</span>
        <span className="topbar-greeting">Hello, {adminName.split(" ")[0]}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
