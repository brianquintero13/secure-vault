"use client";

import React, { useState, useEffect } from "react";

interface ShareLinkItem {
    id: string;
    fileName: string;
    isArchived: boolean;
    createdAt: string;
}

export default function ArchiveManager() {
    const [links, setLinks] = useState<ShareLinkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/share/list");
            if (!res.ok) {
                throw new Error("Could not load link lists.");
            }
            const data = await res.json();
            setLinks(data);
        } catch (err: any) {
            setError(err.message || "An error occurred.");
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
            alert("Could not update link status.");
        }
    };

    if (loading) return <div className="text-zinc-500 text-sm">Loading shared links...</div>;
    if (error) return <div className="text-red-500 text-sm">Error: {error}</div>;

    const activeLinks = links.filter((l) => !l.isArchived);
    const archivedLinks = links.filter((l) => l.isArchived);

    return (
        <div className="space-y-8">
            {/* ACTIVE SHARED LINKS */}
            <section>
                <h2 className="text-lg font-bold mb-4 text-zinc-100">Active Shared Links</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    {activeLinks.length === 0 ? (
                        <p className="p-4 text-zinc-500 text-sm">No active shared links found.</p>
                    ) : (
                        activeLinks.map((link) => (
                            <div key={link.id} className="flex justify-between items-center p-4 border-b border-zinc-800 last:border-none">
                                <div>
                                    <p className="font-mono text-sm text-zinc-200">{link.fileName}</p>
                                    <p className="text-xs text-zinc-500 font-sans">Created: {new Date(link.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => toggleArchive(link.id, false)}
                                    className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-white transition-colors"
                                >
                                    Deactivate & Archive
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* ARCHIVED LINKS */}
            <section>
                <h2 className="text-lg font-bold mb-4 text-zinc-500">Inactive / Archived Links</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg opacity-75 overflow-hidden">
                    {archivedLinks.length === 0 ? (
                        <p className="p-4 text-zinc-500 text-sm">No archived links.</p>
                    ) : (
                        archivedLinks.map((link) => (
                            <div key={link.id} className="flex justify-between items-center p-4 border-b border-zinc-800 last:border-none">
                                <p className="font-mono text-sm line-through text-zinc-600">{link.fileName}</p>
                                <button
                                    onClick={() => toggleArchive(link.id, true)}
                                    className="text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded transition-colors"
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