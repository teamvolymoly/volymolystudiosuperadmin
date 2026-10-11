"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { platformAuthApi } from "../services/platform-auth-api";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await platformAuthApi.logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button className="logout-button" disabled={loading} onClick={logout} type="button">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9" />
      </svg>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
