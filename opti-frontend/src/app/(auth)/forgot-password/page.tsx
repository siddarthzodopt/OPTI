"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Success redirect countdown
  useEffect(() => {
    if (step === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === "success" && countdown === 0) {
      router.push("/login");
    }
  }, [step, countdown, router]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/\d/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push("One special character");
    }
    return errors;
  };

  const handleNewPasswordChange = (pwd: string) => {
    setNewPassword(pwd);
    if (pwd) {
      const errors = validatePassword(pwd);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  };

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

    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length > 0) {
      setError("Password does not meet requirements");
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
      setPasswordErrors([]);
      setError("");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>OPTI</h1>
        </div>

        {/* Back Button */}
        {step !== "success" && (
          <button 
            className={styles.backButton}
            onClick={step === "email" ? () => router.push("/login") : handleBack}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <>
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className={styles.title}>Forgot Password?</h2>
            <p className={styles.subtitle}>
              Enter your email to receive a verification code
            </p>

            <form onSubmit={handleEmailSubmit} className={styles.form}>
              <div className={styles.userTypeToggle}>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${userType === "user" ? styles.active : ""}`}
                  onClick={() => setUserType("user")}
                >
                  User Account
                </button>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${userType === "admin" ? styles.active : ""}`}
                  onClick={() => setUserType("admin")}
                >
                  Admin Account
                </button>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
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

              {error && <div className={styles.errorMessage}>{error}</div>}

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? <><span className={styles.spinner}></span>Sending...</> : "Send Code"}
              </button>
            </form>
          </>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <>
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className={styles.title}>Enter Verification Code</h2>
            <p className={styles.subtitle}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            <form onSubmit={handleOtpSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="otp" className={styles.label}>Verification Code</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    id="otp"
                    className={`${styles.input} ${styles.otpInput}`}
                    placeholder="000000"
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
                  {error}
                </div>
              )}

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? <><span className={styles.spinner}></span>Verifying...</> : "Verify Code"}
              </button>

              <button type="button" onClick={handleResendOtp} className={styles.linkButton} disabled={loading}>
                Resend Code
              </button>
            </form>
          </>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <>
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 className={styles.title}>Create New Password</h2>
            <p className={styles.subtitle}>
              Enter a strong password for your account
            </p>

            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>New Password</label>
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
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={loading}
                  >
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {newPassword && passwordErrors.length > 0 && (
                  <div className={styles.passwordHints}>
                    {passwordErrors.map((err, i) => <div key={i}>• {err}</div>)}
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
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
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? <><span className={styles.spinner}></span>Resetting...</> : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <>
            <div className={`${styles.iconCircle} ${styles.successCircle}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className={styles.title}>Password Reset!</h2>
            <p className={styles.subtitle}>
              Your password has been changed successfully
            </p>

            <div className={styles.successBox}>
              Redirecting to login in <strong>{countdown}</strong> seconds...
            </div>

            <button onClick={() => router.push("/login")} className={styles.submitButton}>
              Go to Login Now
            </button>
          </>
        )}

        {/* Progress Indicator */}
        {step !== "success" && (
          <div className={styles.progressIndicator}>
            <div className={`${styles.progressDot} ${step === "email" || step === "otp" || step === "password" ? styles.active : ""}`}></div>
            <div className={`${styles.progressDot} ${step === "otp" || step === "password" ? styles.active : ""}`}></div>
            <div className={`${styles.progressDot} ${step === "password" ? styles.active : ""}`}></div>
          </div>
        )}
      </div>
    </div>
  );
}
