// src/components/LocationSelector.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LOCATIONS, getDefaultLocationFromNavigator } from "@/lib/location";

export default function LocationSelector({
  currentLocation,
}: {
  currentLocation?: string | null;
}) {
  const router = useRouter();
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Find current location display info
  const currentLocationInfo = currentLocation 
    ? SUPPORTED_LOCATIONS.find(loc => loc.countryCode.toLowerCase() === currentLocation.toLowerCase())
    : null;

  const setLocation = async (countryCode: string | null) => {
    setIsSettingLocation(true);
    try {
      const response = await fetch('/api/set-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode }),
      });

      if (response.ok) {
        router.refresh(); // Refresh to update server components
      }
    } catch (error) {
      console.error('Failed to set location:', error);
    } finally {
      setIsSettingLocation(false);
    }
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      // Get default location from navigator (language-based)
      const detectedLocation = getDefaultLocationFromNavigator();
      await setLocation(detectedLocation.countryCode);
    } catch (error) {
      console.error('Failed to detect location:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="p-4 border border-slate-700 bg-[#0B1220] rounded-md shadow-sm">
      <p className="text-[11px] font-semibold text-slate-300 tracking-wide uppercase mb-2">
        Your Location
      </p>

      {currentLocationInfo ? (
        // Location is set - show current location with option to change
        <div className="space-y-3">
          <div className="px-3 py-2 bg-[#111827] border border-slate-600 rounded">
            <p className="text-[12px] text-white font-medium">
              {currentLocationInfo.label}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Prioritizing results for your location
            </p>
          </div>
          
          <button
            onClick={() => setLocation(null)}
            disabled={isSettingLocation}
            className="w-full py-2 rounded-md bg-slate-600 hover:bg-slate-700 text-[12px] text-white font-medium disabled:opacity-50"
          >
            {isSettingLocation ? 'Updating...' : 'Switch to Global'}
          </button>
        </div>
      ) : (
        // No location set - show global with option to set location
        <div className="space-y-3">
          <div className="px-3 py-2 bg-[#111827] border border-slate-600 rounded">
            <p className="text-[12px] text-white font-medium">
              Global (worldwide deals)
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Showing all results, including international shipping
            </p>
          </div>

          <button
            onClick={handleDetectLocation}
            disabled={isDetecting || isSettingLocation}
            className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-[12px] text-white font-medium disabled:opacity-50"
          >
            {isDetecting ? 'Detecting...' : 'Detect my location'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#0B1220] text-slate-400">or choose manually</span>
            </div>
          </div>

          <div className="space-y-2">
            {SUPPORTED_LOCATIONS.map((location) => (
              <button
                key={location.countryCode}
                onClick={() => setLocation(location.countryCode)}
                disabled={isSettingLocation}
                className="w-full px-3 py-2 text-left bg-[#111827] border border-slate-600 rounded hover:bg-slate-700 text-[12px] text-white disabled:opacity-50"
              >
                {location.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
