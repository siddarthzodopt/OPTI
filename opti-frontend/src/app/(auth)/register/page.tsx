"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin-register.module.css";

export default function AdminRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, label: "", color: "" });
      return;
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    let label = "";
    let color = "";

    if (score <= 2) {
      label = "Weak";
      color = "#f44336";
    } else if (score === 3 || score === 4) {
      label = "Medium";
      color = "#ff9800";
    } else {
      label = "Strong";
      color = "#4caf50";
    }

    setPasswordStrength({ score, label, color });
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    checkPasswordStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must contain uppercase, lowercase, number, and special character");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Your API call here
      // const response = await fetch('/api/admin/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: formData.email, password: formData.password })
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // On success, redirect to login
      router.push("/login?registered=true");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 8;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {/* OPTI Branding - Top Left */}
        <div className={styles.brandingCorner}>
          <h1 className={styles.brandName}>OPTI</h1>
        </div>

        {/* Back to Login Button - Top Right */}
        <button
          className={styles.backButton}
          onClick={() => router.push("/login")}
          aria-label="Back to login"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Login</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.card}>
          {/* Icon */}
          <div className={styles.iconContainer}>
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className={styles.title}>Admin Registration</h2>
          <p className={styles.subtitle}>
            Create your admin account to manage OPTI platform
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Admin Email <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <svg
                  className={styles.inputIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  placeholder="admin@opti.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <svg
                  className={styles.inputIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={styles.input}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
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
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className={styles.strengthContainer}>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles.strengthFill}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span
                    className={styles.strengthLabel}
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              <small className={styles.hint}>
                Minimum 8 characters with uppercase, lowercase, number & special character
              </small>
            </div>

            {/* Confirm Password Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <svg
                  className={styles.inputIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  className={styles.input}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <small className={styles.errorHint}>Passwords do not match</small>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <small className={styles.successHint}>✓ Passwords match</small>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Creating Account...
                </>
              ) : (
                "Create Admin Account"
              )}
            </button>

            {/* Already have account */}
            <div className={styles.loginLink}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className={styles.linkButton}
                disabled={loading}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className={styles.securityNotice}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
          <p>Your data is encrypted and secured with industry-standard protection</p>
        </div>
      </div>
    </div>
  );
}
