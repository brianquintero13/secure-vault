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

    // 🔥 NEW STATE: Track which document's logs are currently open
    const [openLogsId, setOpenLogsId] = useState<string | null>(null);

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
                    <div key={doc.id} className={`border rounded-lg flex flex-col ${doc.revoked ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>

                        {/* --- The Main Row --- */}
                        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="mb-4 sm:mb-0">
                                <h3 className={`font-medium truncate max-w-xs ${doc.revoked ? 'text-red-700 line-through' : 'text-gray-900'}`} title={displayPath}>
                                    {displayPath}
                                </h3>
                                {/* Displaying the owner's email right next to the date */}
                                <p className="text-xs text-gray-500 mt-1">
                                    Vaulted: {new Date(doc.createdAt).toLocaleDateString()} • By: <span className="font-semibold text-gray-700">{doc.owner?.email || "Unknown"}</span>
                                </p>

                                {/* 🔥 THE LOG TOGGLE BUTTON */}
                                {doc.auditEvents?.length > 0 && (
                                    <button
                                        onClick={() => setOpenLogsId(openLogsId === doc.id ? null : doc.id)}
                                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center"
                                    >
                                        {openLogsId === doc.id ? "Hide Logs ▲" : `View Activity Logs (${doc.auditEvents.length}) ▼`}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col items-end w-full sm:w-auto">
                                {doc.revoked ? (
                                    <span className="px-4 py-2 bg-red-100 text-red-800 text-sm font-bold tracking-wide uppercase rounded-md border border-red-200">
                    Access Destroyed
                  </span>
                                ) : (
                                    <div className="flex flex-col items-end space-y-3 w-full">
                                        {!activeLinks[doc.id] ? (
                                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                                <input
                                                    type="email"
                                                    placeholder="Recipient Email"
                                                    value={targetEmail}
                                                    onChange={(e) => setTargetEmail(e.target.value)}
                                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-48 focus:outline-none focus:border-black"
                                                />
                                                <button
                                                    onClick={() => handleGenerateLink(doc.id)}
                                                    disabled={generating === doc.id}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition disabled:bg-gray-400"
                                                >
                                                    {generating === doc.id ? "Encrypting..." : "Create Link"}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end w-full">
                                                <span className="text-xs font-semibold text-green-600 mb-1 uppercase">Active Gateway</span>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={activeLinks[doc.id]}
                                                    className="border border-green-200 bg-green-50 text-green-900 rounded-md px-3 py-2 text-sm w-full sm:w-72 cursor-pointer outline-none mb-2"
                                                    onClick={(e) => {
                                                        e.currentTarget.select();
                                                        navigator.clipboard.writeText(activeLinks[doc.id]);
                                                        alert("Link copied!");
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleRevoke(doc.id)}
                                            disabled={revoking === doc.id}
                                            className="text-xs font-semibold text-red-600 hover:text-red-800 underline transition"
                                        >
                                            {revoking === doc.id ? "Dissolving..." : "Revoke All Access"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- 🔥 THE LOG DROPDOWN PANEL --- */}
                        {openLogsId === doc.id && (
                            <div className="border-t border-gray-200 bg-white p-4 rounded-b-lg">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Audit Trail</h4>
                                <ul className="space-y-2">
                                    {doc.auditEvents.map(event => (
                                        <li key={event.id} className="flex items-center text-sm">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span>
                                            <span className="font-mono text-gray-500 mr-4 w-40">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                                            <span className="font-medium text-gray-900">
                        Client accessed document vault
                      </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>
                );
            })}
        </div>
    );
}