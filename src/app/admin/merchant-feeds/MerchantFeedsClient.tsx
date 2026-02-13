"use client";

import React, { useState, useEffect } from "react";
import { AFFILIATE_INGEST_PROVIDERS } from '@/config/affiliateIngestion.client';

type Merchant = {
  id: string;
  storeName: string;
  name: string | null;
};

type MerchantFeed = {
  id: string;
  merchantId: string;
  name: string;
  sourceType: string;
  sourceSlug: string;
  merchant: {
    storeName: string;
  };
};

export default function MerchantFeedsClient() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [feeds, setFeeds] = useState<MerchantFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for new feed
  const [newFeedName, setNewFeedName] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [sourceType, setSourceType] = useState("csv");
  const [sourceSlug, setSourceSlug] = useState("profitshare");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state for new merchant (simple)
  const [newMerchantStoreName, setNewMerchantStoreName] = useState("");
  const [isCreatingMerchant, setIsCreatingMerchant] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    setError(null);
    try {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";
      const [merchantsRes, feedsRes] = await Promise.all([
        fetch("/api/admin/merchants", { headers: { "x-admin-token": adminToken } }),
        fetch("/api/admin/merchant-feeds", { headers: { "x-admin-token": adminToken } })
      ]);

      const merchantsData = await merchantsRes.json();
      const feedsData = await feedsRes.json();

      if (merchantsData.ok) setMerchants(merchantsData.merchants);
      if (feedsData.ok) setFeeds(feedsData.feeds);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load merchants or feeds.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateMerchant(e: React.FormEvent) {
    e.preventDefault();
    if (!newMerchantStoreName.trim()) return;

    setIsCreatingMerchant(true);
    try {
      const res = await fetch("/api/admin/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
        body: JSON.stringify({ storeName: newMerchantStoreName }),
      });

      const data = await res.json();
      if (data.ok) {
        setMerchants(prev => [...prev, data.merchant]);
        setSelectedMerchantId(data.merchant.id);
        setNewMerchantStoreName("");
      } else {
        alert(data.error || "Failed to create merchant");
      }
    } catch (err) {
      alert("Network error creating merchant");
    } finally {
      setIsCreatingMerchant(false);
    }
  }

  async function handleCreateFeed(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMerchantId || !newFeedName.trim() || !sourceSlug) {
      setFormMsg({ type: 'error', text: "Please fill in all required fields." });
      return;
    }

    setIsSubmitting(true);
    setFormMsg(null);

    try {
      const res = await fetch("/api/admin/merchant-feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
        body: JSON.stringify({
          merchantId: selectedMerchantId,
          name: newFeedName,
          sourceType,
          sourceSlug,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setFormMsg({ type: 'success', text: "Feed created successfully!" });
        setNewFeedName("");
        // Refresh feeds list
        const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";
        const feedsRes = await fetch("/api/admin/merchant-feeds", { headers: { "x-admin-token": adminToken } });
        const feedsData = await feedsRes.json();
        if (feedsData.ok) setFeeds(feedsData.feeds);
      } else {
        setFormMsg({ type: 'error', text: data.error || "Failed to create feed" });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: "Network error creating feed" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* List of feeds */}
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-lg font-semibold">Existing Feeds</h2>
        {feeds.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No feeds defined yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Feed Name</th>
                  <th className="px-4 py-3 font-semibold">Merchant</th>
                  <th className="px-4 py-3 font-semibold">Adapter</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {feeds.map(feed => (
                  <tr key={feed.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{feed.name}</td>
                    <td className="px-4 py-3 font-medium">{feed.merchant.storeName}</td>
                    <td className="px-4 py-3 text-slate-500">{feed.sourceSlug}</td>
                    <td className="px-4 py-3 text-slate-500 uppercase text-[10px] tracking-wider">{feed.sourceType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forms */}
      <div className="space-y-8">
        {/* Create Merchant Form */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Add Merchant</h2>
          <form onSubmit={handleCreateMerchant} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Store Name (ID)</label>
              <input
                type="text"
                value={newMerchantStoreName}
                onChange={(e) => setNewMerchantStoreName(e.target.value)}
                placeholder="e.g. MyRetailer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isCreatingMerchant || !newMerchantStoreName.trim()}
              className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {isCreatingMerchant ? "Creating..." : "Create Merchant"}
            </button>
          </form>
        </section>

        {/* Create Feed Form */}
        <section className="space-y-4 rounded-2xl border border-[var(--pl-primary)]/20 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pl-primary)]">New Feed</h2>
          
          {formMsg && (
            <div className={`rounded-lg px-3 py-2 text-xs ${formMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {formMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateFeed} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Merchant</label>
              <select
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a merchant...</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.storeName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Feed Name</label>
              <input
                type="text"
                value={newFeedName}
                onChange={(e) => setNewFeedName(e.target.value)}
                placeholder="e.g. Winter Catalog 2024"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Source Type</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="csv">CSV</option>
                  <option value="api">API</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Adapter</label>
                <select
                  value={sourceSlug}
                  onChange={(e) => setSourceSlug(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {AFFILIATE_INGEST_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedMerchantId || !newFeedName.trim()}
              className="w-full rounded-lg bg-[var(--pl-primary)] py-2 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Feed"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
