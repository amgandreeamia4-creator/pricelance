"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Context for admin-specific UI settings
 * Currently controls visibility of disabled affiliate networks in admin UI
 */
type AdminSettingsContextType = {
  /** Whether to show disabled affiliate networks (e.g., Profitshare) in admin UI */
  showDisabledNetworks: boolean;
  /** Toggle function for showing/hiding disabled networks */
  toggleShowDisabledNetworks: () => void;
};

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

/**
 * Provider component for admin settings context
 * Persists the toggle state in localStorage
 */
export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage or default to false
  const [showDisabledNetworks, setShowDisabledNetworks] = useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_show_disabled_networks");
      if (saved !== null) {
        setShowDisabledNetworks(saved === "true");
      }
    } catch (error) {
      console.warn("Failed to load admin settings from localStorage:", error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("admin_show_disabled_networks", showDisabledNetworks.toString());
    } catch (error) {
      console.warn("Failed to save admin settings to localStorage:", error);
    }
  }, [showDisabledNetworks]);

  const toggleShowDisabledNetworks = () => {
    setShowDisabledNetworks(prev => !prev);
  };

  return (
    <AdminSettingsContext.Provider
      value={{
        showDisabledNetworks,
        toggleShowDisabledNetworks,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  );
}

/**
 * Hook to use admin settings context
 */
export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error("useAdminSettings must be used within an AdminSettingsProvider");
  }
  return context;
}
