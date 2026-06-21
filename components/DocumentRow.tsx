'use client';

import { useState } from 'react';

interface DocumentRowProps {
    documentId: string;
    name: string;
}

export default function DocumentRow({ documentId, name }: DocumentRowProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleViewDocument = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch the secure pre-signed URL from your new vault API route
            const response = await fetch(`/api/vault/${documentId}`);

            if (!response.ok) {
                throw new Error('Failed to authenticate or fetch link');
            }

            const data = await response.json();

            if (data.downloadUrl) {
                // 2. Open the secure temporary token link in a new tab
                window.open(data.downloadUrl, '_blank');
            } else {
                alert(data.error || "Failed to retrieve secure access link.");
            }
        } catch (error) {
            console.error("Error fetching secure document link:", error);
            alert("An error occurred while trying to access the vault.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">

            {/* Left Side: Document Icon and Name */}
            <div className="flex items-center space-x-3 truncate mr-4">
                <svg
                    className="w-6 h-6 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-gray-700 truncate">{name}</span>
            </div>

            {/* Right Side: Action Button */}
            <button
                onClick={handleViewDocument}
                disabled={isLoading}
                className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors whitespace-nowrap ${
                    isLoading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {isLoading ? 'Opening...' : 'View Securely'}
            </button>

        </div>
    );
}