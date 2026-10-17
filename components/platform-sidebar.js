"use client";

import { useState } from "react";
import BrandMark from "./brand-mark";
import PlatformNav from "./platform-nav";

export default function PlatformSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="mobile-nav-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      <button
        aria-hidden={!open}
        aria-label="Close navigation"
        className={`sidebar-backdrop ${open ? "visible" : ""}`}
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand-row">
          <BrandMark />
        </div>

        <PlatformNav onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
