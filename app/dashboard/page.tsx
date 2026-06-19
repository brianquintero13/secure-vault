export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";
import DocumentUploader from "./DocumentUploader";
import VaultTable from "./VaultTable";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
    });

    if (!dbUser) {
        redirect("/login");
    }

    // 🔥 THE MASTER QUERY: Pulls docs, owners, AND the audit logs from Neon
    const teamDocuments = await prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            owner: {
                select: { email: true }
            },
            auditEvents: {
                orderBy: { createdAt: "desc" }
            }
        }
    });

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            {/* Top Navbar Section */}
            <div className="mb-8 flex items-center justify-between border-b pb-4 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Firm Document Vault</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Secure Session Verified for: <span className="font-semibold text-black">{session.user.email}</span>
                    </p>
                </div>
                <LogoutButton />
            </div>

            {/* Interactive S3 Upload Module */}
            <DocumentUploader />

            {/* Active Distribution Table Panel */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-4xl mx-auto">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Active Distribution Vault</h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Generate self-destructing access links for your encrypted files. Links automatically expire after 48 hours or 3 views.
                    </p>
                </div>

                {/* Handing the complete data package to the table */}
                <VaultTable documents={teamDocuments} />
            </div>
        </div>
    );
}