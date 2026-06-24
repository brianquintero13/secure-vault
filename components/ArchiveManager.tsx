"use client";

import React, { useState, useEffect } from "react";

interface AccessLog {
    id: string;
    ipAddress: string;
    city: string | null;
    country: string | null;
    deviceOS: string | null;
    viewedAt: string;
}

interface ShareLinkItem {
    id: string;
    fileName: string;
    documentUrl: string;
    creatorEmail: string | null;
    requirePassword?: boolean;
    maxViews: number | null;
    currentViews: number;
    isArchived: boolean;
    createdAt: string;
    logs: AccessLog[];
}

export default function ArchiveManager() {
    const [links, setLinks] = useState<ShareLinkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/share/list");
            if (!res.ok) {
                throw new Error("Failed to retrieve share list.");
            }
            const data = await res.json();
            setLinks(data);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const toggleArchive = async (linkId: string, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/share/archive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkId, archive: !currentStatus }),
            });
            if (res.ok) {
                await fetchLinks();
            }
        } catch (err) {
            alert("Failed to modify archive status.");
        }
    };

    const toggleExpand = (linkId: string) => {
        setExpandedLinkId(expandedLinkId === linkId ? null : linkId);
    };

    const copyLink = (linkId: string) => {
        const baseUrl = window.location.origin;
        navigator.clipboard.writeText(`${baseUrl}/view/${linkId}`);
        alert("Share link copied to clipboard!");
    };

    if (loading) return <div className="text-zinc-500 text-sm">Loading shared links...</div>;
    if (error) return <div className="text-red-500 text-sm">Error: {error}</div>;

    const activeLinks = links.filter((l) => !l.isArchived);
    const archivedLinks = links.filter((l) => l.isArchived);

    return (
        <div className="space-y-8 font-sans">
            {/* ACTIVE SHARED LINKS */}
            <section>
                <h2 className="text-lg font-bold mb-4 text-zinc-100">Active Shared Links</h2>
                <div className="space-y-4">
                    {activeLinks.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-zinc-500 text-sm">
                            No active shared links found. Use the tab above to create one.
                        </div>
                    ) : (
                        activeLinks.map((link) => (
                            <div key={link.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-100 text-base">{link.fileName}</h3>
                                        <p className="text-xs text-zinc-500 font-sans">
                                            Shared by: {link.creatorEmail || "System"} • Created: {new Date(link.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => copyLink(link.id)}
                                            className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 transition font-sans"
                                        >
                                            Copy Link
                                        </button>
                                        {/* BUTTON Wording Updated to "Deactivate & Archive" */}
                                        <button
                                            onClick={() => toggleArchive(link.id, false)}
                                            className="text-xs bg-red-950/40 text-red-400 hover:bg-red-950/80 px-3 py-1.5 rounded border border-red-900/40 transition font-sans"
                                        >
                                            Deactivate & Archive
                                        </button>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-950/50 p-3 rounded border border-zinc-800/40 text-xs">
                                    <div>
                                        <span className="text-zinc-500 block mb-0.5">Security Status</span>
                                        <span className={link.requirePassword ? "text-emerald-400 font-medium" : "text-zinc-400"}>
                      {link.requirePassword ? "Password Protected" : "No Password"}
                    </span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block mb-0.5">Views Used</span>
                                        <span className="text-zinc-300 font-mono font-medium">
                      {link.currentViews} / {link.maxViews || "Unlimited"}
                    </span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <span className="text-zinc-500 block mb-0.5 font-sans">Client View Log</span>
                                        <button
                                            onClick={() => toggleExpand(link.id)}
                                            className="text-emerald-400 hover:underline font-semibold font-sans"
                                        >
                                            {link.logs.length} View{link.logs.length !== 1 ? "s" : ""} • {expandedLinkId === link.id ? "Hide History" : "Show History"}
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable History Log */}
                                {expandedLinkId === link.id && (
                                    <div className="border-t border-zinc-800 pt-3 space-y-2">
                                        <h4 className="text-xs font-bold text-zinc-400 tracking-wider uppercase font-sans">Viewer Activity History</h4>
                                        {link.logs.length === 0 ? (
                                            <p className="text-xs text-zinc-600 italic font-sans">No views recorded yet.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                {link.logs.map((log) => (
                                                    <div key={log.id} className="flex justify-between items-center text-xs bg-zinc-950 p-2.5 rounded border border-zinc-850">
                                                        <div>
                                                            <p className="text-zinc-300 font-medium font-sans">{log.city || "Unknown City"}, {log.country || "Unknown Country"}</p>
                                                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">IP: {log.ipAddress} • OS: {log.deviceOS || "Unknown Device"}</p>
                                                        </div>
                                                        <span className="text-zinc-400 font-mono text-[10px]">
                              {new Date(log.viewedAt).toLocaleDateString()} {new Date(log.viewedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* ARCHIVED LINKS */}
            <section className="opacity-75 pt-4 border-t border-zinc-900">
                <h2 className="text-lg font-bold mb-4 text-zinc-500">Inactive / Archived Links</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    {archivedLinks.length === 0 ? (
                        <p className="p-4 text-zinc-500 text-sm font-sans">No archived links.</p>
                    ) : (
                        archivedLinks.map((link) => (
                            <div key={link.id} className="flex justify-between items-center p-4 border-b border-zinc-800 last:border-none">
                                <div>
                                    <p className="font-mono text-sm text-zinc-500 line-through">{link.fileName}</p>
                                    <p className="text-[10px] text-zinc-600 mt-0.5 font-sans">Total Views: {link.currentViews}</p>
                                </div>
                                <button
                                    onClick={() => toggleArchive(link.id, true)}
                                    className="text-xs bg-emerald-950 text-emerald-400 hover:bg-emerald-900 hover:text-white px-3 py-1.5 rounded transition font-sans"
                                >
                                    Restore Link
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}