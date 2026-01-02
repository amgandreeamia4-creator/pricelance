"use client";

import React from "react";
import { useAdminSettings } from "@/contexts/AdminSettingsContext";

/**
 * Admin toggle component for showing/hiding disabled affiliate networks
 * This is a client-side only toggle that persists in localStorage
 */
export default function AdminNetworkToggle() {
  const { showDisabledNetworks, toggleShowDisabledNetworks } = useAdminSettings();

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Admin Network Visibility
          </h3>
          <p className="text-xs text-yellow-600 mt-1">
            Show disabled affiliate networks (Profitshare, etc.) in admin views
          </p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggleShowDisabledNetworks}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
              ${showDisabledNetworks ? "bg-yellow-600" : "bg-gray-200"}
            `}
            role="switch"
            aria-checked={showDisabledNetworks}
            aria-label="Show disabled networks"
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                transition duration-200 ease-in-out
                ${showDisabledNetworks ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
          <span className="ml-3 text-sm text-yellow-700">
            {showDisabledNetworks ? "Showing" : "Hidden"}
          </span>
        </div>
      </div>
      {showDisabledNetworks && (
        <div className="mt-3 text-xs text-yellow-600">
          <strong>Note:</strong> This only affects admin UI visibility. Public APIs will continue to filter out disabled networks.
        </div>
      )}
    </div>
  );
}
