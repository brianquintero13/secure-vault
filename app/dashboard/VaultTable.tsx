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
                    <div key={doc.id} className={`border rounded-lg flex flex-col transition-all ${doc.revoked ? 'bg-red-50 border-red-200 opacity-75' : 'bg-white border-gray-200 hover:shadow-sm'}`}>

                        {/* --- The Main Row --- */}
                        <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

                            {/* Left Side: Details & View Button */}
                            <div className="flex-1">
                                <h3 className={`font-semibold text-lg truncate max-w-md ${doc.revoked ? 'text-red-700 line-through' : 'text-gray-900'}`} title={displayPath}>
                                    {displayPath}
                                </h3>

                                <p className="text-sm text-gray-500 mt-1 mb-3">
                                    Vaulted: {new Date(doc.createdAt).toLocaleDateString()} • By: <span className="font-semibold text