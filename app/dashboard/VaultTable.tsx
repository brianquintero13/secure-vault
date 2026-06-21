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
            <div className="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300 font-sans">
                No documents securely vaulted yet.
            </div>
        );
    }

    return (
        <div className="space-y-4 font-sans">
            {documents.map((doc) => {
                const displayPath = doc.filename.split("-").slice(1).join("-") || doc.filename;

                return (
                    <div key={doc.id} className={`border rounded-lg flex flex-col transition-all ${doc.revoked ? 'bg-red-50 border-red-200 opacity-75' : 'bg-white border-gray-200 hover:shadow-sm'}`}>

                        {/* --- The Main Row --- */}
                        <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

                            {/* Left Side: Details & View Button */}
                            <div className="flex-1">
                                <h3 className={`font-semibold text-lg truncate max-w-md ${doc.revoked ? 'text-red-700 line-through' : 'text-gray-900'}`} title={displayPath}>
                                    {displayPath}
                                </h3>

                                <p className="text-sm text-gray-500 mt-1 mb-3">
                                    Vaulted: {new Date(doc.createdAt).toLocaleDateString()} • By: <span className="font-semibold text-gray-700">{doc.owner.email}</span>
                                </p>

                                {/* View Safely Button */}
                                {!doc.revoked && (
                                    <button
                                        onClick={() => handleViewDocument(doc.id)}
                                        disabled={viewing !== null}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
                                    >
                                        {viewing === doc.id ? "Opening Securely..." : "View Document Safely"}
                                    </button>
                                )}
                            </div>

                            {/* Right Side: Link Generator Form & Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                                {!doc.revoked && (
                                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                        <input
                                            type="email"
                                            value={targetEmail}
                                            onChange={(e) => setTargetEmail(e.target.value)}
                                            placeholder="Recipient email"
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded p-2 focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            onClick={() => handleGenerateLink(doc.id)}
                                            disabled={generating !== null}
                                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {generating === doc.id ? "Generating..." : "Create Link"}
                                        </button>
                                    </div>
                                )}

                                {/* Audit Logs & Revoke Actions */}
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setOpenLogsId(openLogsId === doc.id ? null : doc.id)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded font-medium transition"
                                    >
                                        {openLogsId === doc.id ? "Hide Logs" : "View Logs"}
                                    </button>

                                    {!doc.revoked && (
                                        <button
                                            onClick={() => handleRevoke(doc.id)}
                                            disabled={revoking !== null}
                                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded font-medium transition disabled:opacity-50"
                                        >
                                            {revoking === doc.id ? "Revoking..." : "Revoke Access"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- Active Generated Link Banner --- */}
                        {activeLinks[doc.id] && (
                            <div className="mx-5 mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-4 text-sm text-emerald-800">
                                <span className="truncate font-mono select-all flex-1">{activeLinks[doc.id]}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeLinks[doc.id]);
                                        alert("Copied securely to clipboard!");
                                    }}
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded transition font-medium"
                                >
                                    Copy
                                </button>
                            </div>
                        )}

                        {/* --- Expandable Audit History Logs --- */}
                        {openLogsId === doc.id && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-5 rounded-b-lg space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audit Events Log</h4>
                                {doc.auditEvents.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No audit history events recorded for this document.</p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {doc.auditEvents.map((log) => (
                                            <div key={log.id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded border border-gray-200">
                                                <span className="font-medium text-gray-700">{log.eventType}</span>
                                                <span className="text-gray-400 font-mono text-[10px]">
                                                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                );
            })}
        </div>
    );
}