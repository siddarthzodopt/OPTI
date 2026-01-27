"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type FormErrors = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState<FormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  /* ===============================
     INITIAL CHECK
  ================================ */
  useEffect(() => {
    const email = sessionStorage.getItem("pendingPasswordReset");
    if (!email) {
      router.replace("/login");
      return;
    }
    setUserEmail(email);
  }, [router]);

  /* ===============================
     PASSWORD VALIDATION
  ================================ */
  const validatePassword = (password: string): string[] => {
    const issues: string[] = [];

    if (password.length < 8) issues.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) issues.push("One uppercase letter");
    if (!/[a-z]/.test(password)) issues.push("One lowercase letter");
    if (!/[0-9]/.test(password)) issues.push("One number");
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      issues.push("One special character");
    }

    return issues;
  };

  const passwordStrength = useMemo(() => {
    if (!formData.newPassword) return { label: "", color: "" };

    const issues = validatePassword(formData.newPassword);
    if (issues.length === 0) return { label: "Strong", color: "#10b981" };
    if (issues.length <= 2) return { label: "Medium", color: "#f59e0b" };
    return { label: "Weak", color: "#ef4444" };
  }, [formData.newPassword]);

  /* ===============================
     FORM SUBMIT
  ================================ */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });

    const storedCreds = JSON.parse(
      localStorage.getItem("userCredentials") || "{}"
    );
    const userCreds = storedCreds[userEmail];

    if (!userCreds) {
      setErrors((p) => ({ ...p, currentPassword: "User not found" }));
      return;
    }

    if (formData.currentPassword !== userCreds.password) {
      setErrors((p) => ({
        ...p,
        currentPassword: "Current password is incorrect",
      }));
      return;
    }

    const passwordIssues = validatePassword(formData.newPassword);
    if (passwordIssues.length > 0) {
      setErrors((p) => ({
        ...p,
        newPassword: passwordIssues.join(", "),
      }));
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setErrors((p) => ({
        ...p,
        newPassword: "New password must be different",
      }));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors((p) => ({
        ...p,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }

    /* ===============================
       SIMULATED UPDATE (FRONTEND)
    ================================ */
    setIsLoading(true);

    setTimeout(() => {
      storedCreds[userEmail] = {
        password: formData.newPassword,
        mustChangePassword: false,
      };
      localStorage.setItem("userCredentials", JSON.stringify(storedCreds));

      const users = JSON.parse(localStorage.getItem("companyUsers") || "[]");
      localStorage.setItem(
        "companyUsers",
        JSON.stringify(
          users.map((u: any) =>
            u.email === userEmail
              ? { ...u, lastLogin: new Date().toISOString() }
              : u
          )
        )
      );

      sessionStorage.removeItem("pendingPasswordReset");
      sessionStorage.setItem("loggedInUser", userEmail);

      setIsLoading(false);
      alert("Password updated successfully");
      router.replace("/opti-chat");
    }, 800);
  };

  const handleCancel = () => {
    sessionStorage.removeItem("pendingPasswordReset");
    router.replace("/login");
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <span className={styles.icon}>🔐</span>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>
            You must change your temporary password before continuing.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <div className={styles.formGroup}>
            <label>Email</label>
            <input type="email" value={userEmail} disabled />
          </div>

          {/* Current Password */}
          <div className={styles.formGroup}>
            <label>Current Password *</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
            />
            {errors.currentPassword && (
              <p className={styles.errorText}>{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className={styles.formGroup}>
            <label>New Password *</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
            />
            {passwordStrength.label && (
              <span style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </span>
            )}
            {errors.newPassword && (
              <p className={styles.errorText}>{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label>Confirm New Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
            {errors.confirmPassword && (
              <p className={styles.errorText}>{errors.confirmPassword}</p>
            )}
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
