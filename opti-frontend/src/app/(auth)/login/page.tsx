"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./style.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://3.7.98.1:5000/api";

type LoginType = "user" | "admin";

export default function LoginPage() {
  const router = useRouter();

  const [loginType, setLoginType] = useState<LoginType>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const endpoint = loginType === "admin" 
        ? `${API_URL}/auth/admin/login`
        : `${API_URL}/auth/user/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store tokens in localStorage
      if (data.data?.token) {
        localStorage.setItem("opti_auth_token", data.data.token);
      }
      if (data.data?.refreshToken) {
        localStorage.setItem("opti_refresh_token", data.data.refreshToken);
      }
      if (data.data?.user) {
        localStorage.setItem("opti_user", JSON.stringify(data.data.user));
      }

      // Redirect based on user type and password status
      if (loginType === "admin") {
        router.push("/admin");
      } else {
        if (data.data?.mustChangePassword) {
          router.push("/change-password");
        } else {
          router.push("/opti-chat");
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>OPTI</h1>
          <p className={styles.tagline}>Your Gateway to Excellence</p>
        </div>

        {/* Title */}
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>
            {loginType === "admin" 
              ? "Sign in to manage your organization" 
              : "Sign in to continue to your account"}
          </p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {/* Login Type Toggle */}
          <div className={styles.loginTypeToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${loginType === "user" ? styles.active : ""}`}
              onClick={() => {
                setLoginType("user");
                setError("");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              User
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${loginType === "admin" ? styles.active : ""}`}
              onClick={() => {
                setLoginType("admin");
                setError("");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Admin
            </button>
          </div>

          {/* Email Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                id="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Signing in...
              </>
            ) : (
              `Sign in as ${loginType === "admin" ? "Admin" : "User"}`
            )}
          </button>

          {/* Links */}
          <div className={styles.links}>
            <Link href="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
            {loginType === "admin" && (
              <>
                <span className={styles.separator}>•</span>
                <Link href="/register" className={styles.link}>
                  Register as Admin
                </Link>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
