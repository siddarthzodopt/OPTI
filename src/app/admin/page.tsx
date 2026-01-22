"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  plan: "free" | "basic" | "premium" | "enterprise";
  status: "active" | "inactive";
  createdAt: Date;
  lastLogin?: Date;
}

interface CompanyPlan {
  name: string;
  maxUsers: number;
  currentUsers: number;
  features: string[];
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [companyPlan, setCompanyPlan] = useState<CompanyPlan>({
    name: "Enterprise",
    maxUsers: 50,
    currentUsers: 0,
    features: ["Unlimited chats", "Advanced analytics", "Priority support", "Custom integrations"],
  });

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user" as "admin" | "user",
    plan: "basic" as "free" | "basic" | "premium" | "enterprise",
  });

  const [passwordData, setPasswordData] = useState({
    userId: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Load users from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem("companyUsers");
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      const usersWithDates = parsed.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      }));
      setUsers(usersWithDates);
      setCompanyPlan((prev) => ({ ...prev, currentUsers: usersWithDates.length }));
    }
  }, []);

  // Save users to localStorage
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("companyUsers", JSON.stringify(users));
      setCompanyPlan((prev) => ({ ...prev, currentUsers: users.length }));
    }
  }, [users]);

  const canAddMoreUsers = companyPlan.currentUsers < companyPlan.maxUsers;

  const handleAddUser = () => {
    if (!canAddMoreUsers) {
      alert(`You've reached the maximum number of users (${companyPlan.maxUsers}) for your ${companyPlan.name} plan. Please upgrade to add more users.`);
      return;
    }

    if (!formData.name || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }

    // Check if email already exists
    if (users.some((u) => u.email === formData.email)) {
      alert("A user with this email already exists");
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      plan: formData.plan,
      status: "active",
      createdAt: new Date(),
    };

    // Generate temporary password
    const tempPassword = `Opti${Math.random().toString(36).slice(-8)}!`;
    
    // Save user credentials
    const credentials = JSON.parse(localStorage.getItem("userCredentials") || "{}");
    credentials[formData.email] = {
      password: tempPassword,
      mustChangePassword: true,
    };
    localStorage.setItem("userCredentials", JSON.stringify(credentials));

    setUsers((prev) => [...prev, newUser]);
    
    // Show credentials to admin
    alert(`User created successfully!\n\nEmail: ${formData.email}\nTemporary Password: ${tempPassword}\n\nThe user must change their password on first login.`);
    
    // Reset form
    setFormData({ name: "", email: "", role: "user", plan: "basic" });
    setShowAddUserModal(false);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedUser.id
          ? { ...user, ...formData }
          : user
      )
    );

    setShowEditUserModal(false);
    setSelectedUser(null);
    setFormData({ name: "", email: "", role: "user", plan: "basic" });
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (window.confirm(`Are you sure you want to delete ${user?.name}? This action cannot be undone.`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      
      // Remove credentials
      const credentials = JSON.parse(localStorage.getItem("userCredentials") || "{}");
      if (user) {
        delete credentials[user.email];
        localStorage.setItem("userCredentials", JSON.stringify(credentials));
      }
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === "active" ? "inactive" : "active" }
          : user
      )
    );
  };

  const handleResetPassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    const user = users.find((u) => u.id === passwordData.userId);
    if (!user) return;

    // Update credentials
    const credentials = JSON.parse(localStorage.getItem("userCredentials") || "{}");
    credentials[user.email] = {
      password: passwordData.newPassword,
      mustChangePassword: false,
    };
    localStorage.setItem("userCredentials", JSON.stringify(credentials));

    alert(`Password reset successfully for ${user.name}`);
    setShowPasswordModal(false);
    setPasswordData({ userId: "", newPassword: "", confirmPassword: "" });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });
    setShowEditUserModal(true);
  };

  const openPasswordModal = (user: User) => {
    setPasswordData({ userId: user.id, newPassword: "", confirmPassword: "" });
    setShowPasswordModal(true);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise": return styles.badgeEnterprise;
      case "premium": return styles.badgePremium;
      case "basic": return styles.badgeBasic;
      default: return styles.badgeFree;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.headerActions}>
            <button className={styles.chatBtn} onClick={() => router.push("/opti-chat")}>
              💬 OPTI Chat
            </button>
            <button className={styles.logout} onClick={() => router.push("/login")}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Company Plan Overview */}
      <div className={styles.planCard}>
        <div className={styles.planHeader}>
          <div>
            <h2 className={styles.planTitle}>{companyPlan.name} Plan</h2>
            <p className={styles.planSubtitle}>
              {companyPlan.currentUsers} / {companyPlan.maxUsers} users
            </p>
          </div>
          <div className={styles.planProgress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(companyPlan.currentUsers / companyPlan.maxUsers) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className={styles.planFeatures}>
          {companyPlan.features.map((feature, index) => (
            <span key={index} className={styles.featureBadge}>
              ✓ {feature}
            </span>
          ))}
        </div>
      </div>

      {/* User Management Section */}
      <div className={styles.managementSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>User Management</h2>
          <button
            className={styles.addButton}
            onClick={() => setShowAddUserModal(true)}
            disabled={!canAddMoreUsers}
          >
            + Add User
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search users..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Users Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No users found. Click "Add User" to create your first user.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.userName}>{user.name}</td>
                    <td className={styles.userEmail}>{user.email}</td>
                    <td>
                      <span className={user.role === "admin" ? styles.badgeAdmin : styles.badgeUser}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={getPlanBadgeColor(user.plan)}>{user.plan}</span>
                    </td>
                    <td>
                      <button
                        className={`${styles.statusBadge} ${
                          user.status === "active" ? styles.statusActive : styles.statusInactive
                        }`}
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td className={styles.dateCell}>
                      {user.createdAt.toLocaleDateString()}
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditModal(user)}
                        title="Edit user"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openPasswordModal(user)}
                        title="Reset password"
                      >
                        🔑
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className={styles.modal} onClick={() => setShowAddUserModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New User</h2>
              <button className={styles.modalClose} onClick={() => setShowAddUserModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email *</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Role</label>
                <select
                  className={styles.select}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Plan</label>
                <select
                  className={styles.select}
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <p className={styles.modalNote}>
                A temporary password will be generated and displayed after user creation.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAddUserModal(false)}>
                Cancel
              </button>
              <button className={styles.submitBtn} onClick={handleAddUser}>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className={styles.modal} onClick={() => setShowEditUserModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit User</h2>
              <button className={styles.modalClose} onClick={() => setShowEditUserModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Role</label>
                <select
                  className={styles.select}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Plan</label>
                <select
                  className={styles.select}
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditUserModal(false)}>
                Cancel
              </button>
              <button className={styles.submitBtn} onClick={handleEditUser}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className={styles.modal} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reset Password</h2>
              <button className={styles.modalClose} onClick={() => setShowPasswordModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Minimum 8 characters"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Re-enter password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className={styles.submitBtn} onClick={handleResetPassword}>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}