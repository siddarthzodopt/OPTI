"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user needs to reset password
    const email = sessionStorage.getItem("pendingPasswordReset");
    if (!email) {
      // If no pending reset, redirect to login
      router.push("/login");
      return;
    }
    setUserEmail(email);
  }, [router]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // Validate current password
    const credentials = JSON.parse(localStorage.getItem("userCredentials") || "{}");
    const userCreds = credentials[userEmail];

    if (!userCreds) {
      setErrors((prev) => ({ ...prev, currentPassword: "User not found" }));
      return;
    }

    if (formData.currentPassword !== userCreds.password) {
      setErrors((prev) => ({ ...prev, currentPassword: "Current password is incorrect" }));
      return;
    }

    // Validate new password
    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setErrors((prev) => ({ ...prev, newPassword: passwordErrors.join(". ") }));
      return;
    }

    // Check if new password is same as current
    if (formData.newPassword === formData.currentPassword) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password must be different from current password",
      }));
      return;
    }

    // Validate password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }

    // Update password
    setIsLoading(true);
    
    setTimeout(() => {
      credentials[userEmail] = {
        password: formData.newPassword,
        mustChangePassword: false,
      };
      localStorage.setItem("userCredentials", JSON.stringify(credentials));

      // Update user's last login
      const users = JSON.parse(localStorage.getItem("companyUsers") || "[]");
      const updatedUsers = users.map((user: any) => {
        if (user.email === userEmail) {
          return { ...user, lastLogin: new Date().toISOString() };
        }
        return user;
      });
      localStorage.setItem("companyUsers", JSON.stringify(updatedUsers));

      // Clear pending reset flag
      sessionStorage.removeItem("pendingPasswordReset");
      
      // Set logged in user
      sessionStorage.setItem("loggedInUser", userEmail);

      setIsLoading(false);
      
      // Show success message and redirect
      alert("Password changed successfully! You can now access OPTI Chat.");
      router.push("/opti-chat");
    }, 1000);
  };

  const handleCancel = () => {
    // Clear session and return to login
    sessionStorage.removeItem("pendingPasswordReset");
    router.push("/login");
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: "", color: "" };
    
    const errors = validatePassword(password);
    
    if (errors.length === 0) {
      return { strength: "Strong", color: "#10b981" };
    } else if (errors.length <= 2) {
      return { strength: "Medium", color: "#f59e0b" };
    } else {
      return { strength: "Weak", color: "#ef4444" };
    }
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>🔐</span>
          </div>
          <h1 className={styles.title}>Reset Your Password</h1>
          <p className={styles.subtitle}>
            For security reasons, you must change your temporary password before accessing your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={userEmail}
              disabled
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Current Password *</label>
            <input
              type="password"
              className={`${styles.input} ${errors.currentPassword ? styles.inputError : ""}`}
              placeholder="Enter your temporary password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              required
            />
            {errors.currentPassword && (
              <p className={styles.errorText}>{errors.currentPassword}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>New Password *</label>
            <input
              type="password"
              className={`${styles.input} ${errors.newPassword ? styles.inputError : ""}`}
              placeholder="Enter your new password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              required
            />
            {formData.newPassword && (
              <div className={styles.strengthIndicator}>
                <span style={{ color: passwordStrength.color }}>
                  {passwordStrength.strength}
                </span>
              </div>
            )}
            {errors.newPassword && (
              <p className={styles.errorText}>{errors.newPassword}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm New Password *</label>
            <input
              type="password"
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
              placeholder="Re-enter your new password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            {errors.confirmPassword && (
              <p className={styles.errorText}>{errors.confirmPassword}</p>
            )}
          </div>

          <div className={styles.requirements}>
            <p className={styles.requirementsTitle}>Password Requirements:</p>
            <ul className={styles.requirementsList}>
              <li className={formData.newPassword.length >= 8 ? styles.valid : ""}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? styles.valid : ""}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? styles.valid : ""}>
                One lowercase letter
              </li>
              <li className={/[0-9]/.test(formData.newPassword) ? styles.valid : ""}>
                One number
              </li>
              <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? styles.valid : ""}>
                One special character (!@#$%^&*...)
              </li>
            </ul>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
