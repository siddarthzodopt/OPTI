"use client";

import { useEffect, useState } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    setMounted(true);

    // Listen for theme changes in other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        document.documentElement.setAttribute("data-theme", e.newValue);
      }
    };

    // Listen for custom theme change events (for same-tab changes)
    const handleThemeChange = (e: CustomEvent) => {
      document.documentElement.setAttribute("data-theme", e.detail.theme);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themechange" as any, handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themechange" as any, handleThemeChange);
    };
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
