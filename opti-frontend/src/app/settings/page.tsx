"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

type Theme = "dark" | "light";

type SettingsState = {
  theme: Theme;
  notifications: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  theme: "dark",
  notifications: true,
  soundEnabled: true,
  autoSave: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load all settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      const savedTheme = (localStorage.getItem("theme") as Theme) || DEFAULT_SETTINGS.theme;
      const savedNotifications = localStorage.getItem("notifications");
      const savedSound = localStorage.getItem("soundEnabled");
      const savedAutoSave = localStorage.getItem("autoSave");

      const loadedSettings: SettingsState = {
        theme: savedTheme,
        notifications: savedNotifications !== null ? savedNotifications === "true" : DEFAULT_SETTINGS.notifications,
        soundEnabled: savedSound !== null ? savedSound === "true" : DEFAULT_SETTINGS.soundEnabled,
        autoSave: savedAutoSave !== null ? savedAutoSave === "true" : DEFAULT_SETTINGS.autoSave,
      };

      setSettings(loadedSettings);
      document.documentElement.setAttribute("data-theme", loadedSettings.theme);
    };

    loadSettings();
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setSettings((prev) => ({ ...prev, theme: newTheme }));
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Dispatch custom event for same-tab theme updates
    window.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme: newTheme } })
    );

    // Show brief save indicator
    showSaveIndicator();
  };

  const handleToggle = (key: keyof Omit<SettingsState, "theme">, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(key, value.toString());
    showSaveIndicator();
  };

  const showSaveIndicator = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleClearChatHistory = () => {
    if (window.confirm("Are you sure you want to clear all chat history? This action cannot be undone.")) {
      // Clear chat history from localStorage
      localStorage.removeItem("chatSessions");
      localStorage.removeItem("messages");
      alert("Chat history cleared successfully!");
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all data. This action cannot be undone.\n\nType 'DELETE' in the next prompt to confirm."
    );
    
    if (confirmed) {
      const verification = prompt("Type DELETE to confirm account deletion:");
      if (verification === "DELETE") {
        // Clear all user data
        localStorage.clear();
        alert("Account deleted. You will be redirected to the login page.");
        router.push("/login");
      } else {
        alert("Account deletion cancelled.");
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Save Indicator */}
      {isSaving && (
        <div className={styles.saveIndicator}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Saved</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarVisible : ""}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.brandName}>OPTI</h1>
        </div>

        <nav className={styles.sidebarNav}>
          <button className={styles.navButton} onClick={() => handleNavigation("/opti-chat")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Chat</span>
          </button>

          <button className={styles.navButton} onClick={() => handleNavigation("/profile")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>

          <button className={`${styles.navButton} ${styles.navButtonActive}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.footerButton} onClick={() => handleNavigation("/login")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <button
            className={styles.menuButton}
            onClick={() => setShowSidebar(!showSidebar)}
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className={styles.headerTitle}>
            <h1>Settings</h1>
            <p>Customize your OPTI experience</p>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.settingsContainer}>
            {/* Appearance Section */}
            <section className={styles.settingSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Appearance</h2>
                  <p className={styles.sectionDescription}>Customize how OPTI looks on your device</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Theme</h3>
                  <p className={styles.settingDescription}>Choose between light and dark mode</p>
                </div>
                <div className={styles.themeToggle}>
                  <button
                    className={`${styles.themeButton} ${settings.theme === "light" ? styles.themeButtonActive : ""}`}
                    onClick={() => handleThemeChange("light")}
                    aria-pressed={settings.theme === "light"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span>Light</span>
                  </button>
                  <button
                    className={`${styles.themeButton} ${settings.theme === "dark" ? styles.themeButtonActive : ""}`}
                    onClick={() => handleThemeChange("dark")}
                    aria-pressed={settings.theme === "dark"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span>Dark</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section className={styles.settingSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Notifications</h2>
                  <p className={styles.sectionDescription}>Manage your notification preferences</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Enable Notifications</h3>
                  <p className={styles.settingDescription}>
                    Receive notifications for new messages and updates
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleToggle("notifications", e.target.checked)}
                    aria-label="Enable notifications"
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Sound Effects</h3>
                  <p className={styles.settingDescription}>Play sound for incoming messages</p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => handleToggle("soundEnabled", e.target.checked)}
                    aria-label="Enable sound effects"
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </section>

            {/* Chat Preferences Section */}
            <section className={styles.settingSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Chat Preferences</h2>
                  <p className={styles.sectionDescription}>Customize your chat experience</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Auto-save Conversations</h3>
                  <p className={styles.settingDescription}>
                    Automatically save your chat history
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleToggle("autoSave", e.target.checked)}
                    aria-label="Enable auto-save"
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </section>

            {/* Account Section */}
            <section className={styles.settingSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Account</h2>
                  <p className={styles.sectionDescription}>Manage your account settings</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Change Password</h3>
                  <p className={styles.settingDescription}>Update your account password</p>
                </div>
                <button 
                  className={styles.actionButton} 
                  onClick={() => alert("Password change functionality coming soon!")}
                >
                  Change
                </button>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Email Address</h3>
                  <p className={styles.settingDescription}>user@example.com</p>
                </div>
                <button 
                  className={styles.actionButton} 
                  onClick={() => alert("Email update functionality coming soon!")}
                >
                  Update
                </button>
              </div>
            </section>

            {/* Danger Zone */}
            <section className={`${styles.settingSection} ${styles.dangerSection}`}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Danger Zone</h2>
                  <p className={styles.sectionDescription}>Irreversible actions</p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Clear Chat History</h3>
                  <p className={styles.settingDescription}>
                    Delete all your conversation history permanently
                  </p>
                </div>
                <button 
                  className={styles.dangerButton}
                  onClick={handleClearChatHistory}
                >
                  Clear All
                </button>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Delete Account</h3>
                  <p className={styles.settingDescription}>
                    Permanently delete your account and all data
                  </p>
                </div>
                <button 
                  className={styles.dangerButton}
                  onClick={handleDeleteAccount}
                >
                  Delete
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}