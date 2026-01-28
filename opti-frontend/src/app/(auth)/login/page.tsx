"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./style.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type LoginType = "user" | "admin";

export default function LoginPage() {
  const router = useRouter();

  const [loginType, setLoginType] = useState<LoginType>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===============================
     FORM SUBMIT
  ================================ */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const endpoint =
        loginType === "admin"
          ? `${API_URL}/auth/admin/login`
          : `${API_URL}/auth/user/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      const { token, refreshToken, user, admin } = result.data;

      // Store tokens
      localStorage.setItem("opti_access_token", token);
      if (refreshToken) {
        localStorage.setItem("opti_refresh_token", refreshToken);
      }

      // User flow
      if (user) {
        localStorage.setItem("opti_user", JSON.stringify(user));

        if (user.mustChangePassword) {
          router.replace("/reset-password");
          return;
        }

        router.replace("/opti-chat");
        return;
      }

      // Admin flow
      if (admin) {
        localStorage.setItem("opti_admin", JSON.stringify(admin));
        router.replace("/settings");
        return;
      }

      throw new Error("Invalid login response");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className={styles.container}>
      {/* LEFT PANEL */}
      <div className={styles.leftPanel}>
        <div className={styles.branding}>
          <h1 className={styles.brandName}>OPTI</h1>
          <p className={styles.tagline}>Your Gateway to Excellence</p>
        </div>
        <div className={styles.footer}>
          <p>© 2026 OPTI. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <h2 className={styles.loginTitle}>Login to your account</h2>
          <p className={styles.loginSubtitle}>
            {loginType === "admin"
              ? "Admin access only"
              : "Access your OPTI workspace"}
          </p>

          {/* LOGIN TYPE TOGGLE */}
          <div className={styles.loginTypeToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                loginType === "user" ? styles.active : ""
              }`}
              onClick={() => {
                setLoginType("user");
                setError("");
              }}
            >
              User
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                loginType === "admin" ? styles.active : ""
              }`}
              onClick={() => {
                setLoginType("admin");
                setError("");
              }}
            >
              Admin
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.showPassword}
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.loginButton}
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : `Login as ${loginType === "admin" ? "Admin" : "User"}`}
            </button>

            <div className={styles.links}>
              <Link href="/forgot-password">Forgot password?</Link>
              {loginType === "admin" && (
                <>
                  <span>|</span>
                  <Link href="/register">Register admin</Link>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
