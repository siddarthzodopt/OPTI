"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

type Step = "email" | "otp" | "password" | "success";
type UserType = "user" | "admin";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://3.7.98.1:5000/api";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [userType, setUserType] = useState<UserType>("user");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Success redirect countdown
  useEffect(() => {
    if (step === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === "success" && countdown === 0) {
      router.push("/login");
    }
  }, [step, countdown, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
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
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          userType: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          userType: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      setStep("password");
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError("Please enter both password fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError("Password must contain uppercase, lowercase, number, and special character");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          newPassword: newPassword,
          confirmPassword: confirmPassword,
          userType: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          userType: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setError("✓ OTP has been resent to your email");
      setTimeout(() => setError(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp("");
      setError("");
    } else if (step === "password") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {/* OPTI Branding - Top Left */}
        <div className={styles.brandingCorner}>
          <h1 className={styles.brandName}>OPTI</h1>
        </div>

        {/* Back Button - Top Right */}
        {step !== "success" && (
          <button 
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.card}>
          {/* Step 1: Email Verification */}
          {step === "email" && (
            <>
              <div className={styles.iconContainer}>
                <div className={styles.iconCircle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>

              <h2 className={styles.title}>Email Verification</h2>
              <p className={styles.subtitle}>
                Enter your email to receive a one-time password for account recovery
              </p>

              <form onSubmit={handleEmailSubmit} className={styles.form}>
                {/* User Type Selection */}
                <div className={styles.userTypeToggle}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${userType === "user" ? styles.toggleButtonActive : ""}`}
                    onClick={() => setUserType("user")}
                  >
                    User Account
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${userType === "admin" ? styles.toggleButtonActive : ""}`}
                    onClick={() => setUserType("admin")}
                  >
                    Admin Account
                  </button>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email Address <span className={styles.required}>*</span>
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
                      placeholder="your.email@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <>
              <div className={styles.iconContainer}>
                <div className={styles.iconCircle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>

              <h2 className={styles.title}>Enter OTP</h2>
              <p className={styles.subtitle}>
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
              <p className={styles.otpExpiry}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                OTP expires in 10 minutes
              </p>

              <form onSubmit={handleOtpSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="otp" className={styles.label}>
                    One-Time Password <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type="text"
                      id="otp"
                      className={styles.input}
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      disabled={loading}
                      maxLength={6}
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className={error.includes("✓") ? styles.successMessage : styles.errorMessage}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      {error.includes("✓") ? (
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      ) : (
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      )}
                    </svg>
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                <div className={styles.links}>
                  <button 
                    type="button"
                    onClick={handleResendOtp}
                    className={styles.linkButton}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === "password" && (
            <>
              <div className={styles.iconContainer}>
                <div className={styles.iconCircle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </div>

              <h2 className={styles.title}>Reset Password</h2>
              <p className={styles.subtitle}>
                Create a new strong password for your account
              </p>

              <form onSubmit={handlePasswordSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="newPassword" className={styles.label}>
                    New Password <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      className={styles.input}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={loading}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <small className={styles.hint}>
                    Must be 8+ characters with uppercase, lowercase, number & special character
                  </small>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm Password <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      className={styles.input}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <>
              <div className={styles.iconContainer}>
                <div className={`${styles.iconCircle} ${styles.successCircle}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>

              <h2 className={styles.title}>Password Reset Successful!</h2>
              <p className={styles.subtitle}>
                Your password has been changed successfully. You can now login with your new password.
              </p>

              <div className={styles.successBox}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.successIcon}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <p>Redirecting to login page in <strong>{countdown}</strong> seconds...</p>
              </div>

              <button 
                onClick={() => router.push("/login")}
                className={styles.primaryButton}
              >
                Go to Login Now
              </button>
            </>
          )}
        </div>

        {/* Progress Indicator */}
        {step !== "success" && (
          <div className={styles.progressIndicator}>
            <div className={`${styles.progressStep} ${step === "email" || step === "otp" || step === "password" ? styles.progressStepActive : ""}`}>
              <span>1</span>
            </div>
            <div className={`${styles.progressLine} ${step === "otp" || step === "password" ? styles.progressLineActive : ""}`}></div>
            <div className={`${styles.progressStep} ${step === "otp" || step === "password" ? styles.progressStepActive : ""}`}>
              <span>2</span>
            </div>
            <div className={`${styles.progressLine} ${step === "password" ? styles.progressLineActive : ""}`}></div>
            <div className={`${styles.progressStep} ${step === "password" ? styles.progressStepActive : ""}`}>
              <span>3</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
