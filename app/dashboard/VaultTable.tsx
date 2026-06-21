"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 🔥 UPGRADED TYPE: Now includes the uploader's email and the audit logs
type Document = {
    id: string;
    filename: string;
    createdAt: Date;
    revoked: boolean;
    owner: { email: string };
    auditEvents: { id: string; eventType: string; createdAt: Date }[];
};

export default function VaultTable({ documents }: { documents: Document[] }) {
    const router = useRouter();
    const [activeLinks, setActiveLinks] = useState<Record<string, string>>({});
    const [generating, setGenerating] = useState<string | null>(null);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [targetEmail, setTargetEmail] = useState("");

    // 🔥 NEW STATE: Track which document is currently being opened
    const [viewing, setViewing] = useState<string | null>(null);

    // Track which document's logs are currently open
    const [openLogsId, setOpenLogsId] = useState<string | null>(null);

    // 🔥 NEW FUNCTION: Internal secure viewing logic
    const handleViewDocument = async (docId: string) => {
        setViewing(docId);
        try {
            const response = await fetch(`/api/vault/${docId}`);
            if (!response.ok) throw new Error("Failed to authenticate or fetch link");

            const data = await response.json();

            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank');
            } else {
                alert(data.error || "Failed to retrieve secure access link.");
            }
        } catch (error) {
            console.error("Error fetching secure document link:", error);
            alert("An error occurred while trying to access the vault.");
        } finally {
            setViewing(null);
        }
    };

    const handleGenerateLink = async (docId: string) => {
        if (!targetEmail) {
            alert("Please enter a recipient email first.");
            return;
        }
        setGenerating(docId);
        try {
            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: docId, recipientEmail: targetEmail, expiresInHours: 48, maxViews: 3 }),
            });
            if (!res.ok) throw new Error("Failed to generate secure link");
            const data = await res.json();
            setActiveLinks((prev) => ({ ...prev, [docId]: data.publicLink }));
            setTargetEmail("");
        } catch (error) {
            console.error(error);
            alert("Security protocol failed.");
        } finally {
            setGenerating(null);
        }
    };

    const handleRevoke = async (docId: string) => {
        if (!confirm("WARNING: This will instantly and permanently destroy all access to this document. Proceed?")) return;

        setRevoking(docId);
        try {
            const res = await fetch("/api/revoke", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: docId }),
            });
            if (!res.ok) throw new Error("Failed to execute kill switch");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to dissolve document access.");
        } finally {
            setRevoking(null);
        }
    };

    if (!documents || documents.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No documents securely vaulted yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {documents.map((doc) => {
                const displayPath = doc.filename.split("-").slice(1).join("-") || doc.filename;

                return (
                    <div key={doc.id} className={`border rounded-lg flex flex-col bg-zinc-900 p-4 border-zinc-800 shadow-sm ${link.isArchived ? "opacity-70" : ""}`}>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="font-bold text-zinc-100 text-base">{link.fileName || displayTitle}</h3>
                                <p className="text-xs text-zinc-500 mt-0.5 font-sans">
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
                                <button
                                    onClick={() => toggleArchive(link.id, false)}
                                    className="text-xs bg-red-950/40 text-red-400 hover:bg-red-950/80 px-3 py-1.5 rounded border border-red-900/40 transition font-sans"
                                >
                                    Archive
                                </button>
                            </div>
                        </div>

                        {/* Link Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-950/50 p-3 rounded border border-zinc-800/40 text-xs mt-3">
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

                        {/* Expandable Client Activity Log */}
                        {expandedLinkId === link.id && (
                            <div className="border-t border-zinc-800 pt-3 space-y-2 mt-3">
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

                <section className="opacity-75 pt-4 border-t border-zinc-900">
                <h2 className="text-lg font-bold mb-4 text-zinc-500 font-sans">Inactive / Archived Links</h2>
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