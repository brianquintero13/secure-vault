"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentUploader() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage("");
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setMessage("Initializing secure upload pipeline...");

        try {
            // 1. Contact backend API route to get secure AWS Pre-signed URL
            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    size: file.size,
                }),
            });

            if (!res.ok) throw new Error("Failed to clear security checkpoint.");
            const { uploadUrl } = await res.json();

            setMessage("Streaming document chunk layers directly to encrypted vault...");

            // 2. Upload file binary data directly to AWS S3 using the temporary token
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            // 🔥 EXTRACT RAW AWS ERROR IF IT FAILS
            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error("❌ RAW AWS S3 ERROR PAYLOAD:", errorText);
                throw new Error(`AWS Storage rejected transmission (Status: ${uploadResponse.status}).`);
            }

            setMessage("Vault successfully locked. Database synced! ✅");
            setFile(null);

            router.refresh();
        } catch (err: any) {
            setMessage(`Security failure: ${err.message || "Upload aborted"}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-4xl mx-auto mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload New Sensitive Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <p className="mb-2 text-sm text-gray-500 font-medium">
                                {file ? `Selected: ${file.name}` : "Click to browse or drop contract files here"}
                            </p>
                            <p className="text-xs text-gray-400">PDF, DOCX, or IMAGES up to 50MB</p>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.jpg,.png" />
                    </label>
                </div>

                {message && (
                    <p className="text-sm font-medium p-2 bg-blue-50 text-blue-700 rounded-md text-center">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={!file || uploading}
                    className={`w-full rounded-md py-2 font-medium text-white transition ${
                        !file || uploading ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-800"
                    }`}
                >
                    {uploading ? "Securing Payload..." : "Transmit to Cloud Vault"}
                </button>
            </form>
        </div>
    );
}