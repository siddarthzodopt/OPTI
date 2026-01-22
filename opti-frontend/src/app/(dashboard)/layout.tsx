"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./style.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Later we will clear token/cookie here
    router.push("/login");
  };

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2 className={styles.logo}>OPTI</h2>
          <p className={styles.smallText}>Dashboard</p>
        </div>

        <nav className={styles.nav}>
          <Link
            href="/subscriptions"
            className={`${styles.navLink} ${
              pathname === "/subscriptions" ? styles.active : ""
            }`}
          >
            Subscriptions
          </Link>
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Page Content */}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
