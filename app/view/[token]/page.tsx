import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { redirect } from "next/navigation";
import UnlockButton from "./UnlockButton";
import { Resend } from "resend";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function SecureGatewayPage({ params }: PageProps) {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    // Pull the share record, document details, and owner details
    const shareRecord = await prisma.recipientShare.findUnique({
        where: { tokenHash: token },
        include: {
            document: {
                include: { owner: true }
            }
        },
    });

    // --- SECURITY FIREWALL CHECKS ---
    if (!shareRecord) {
        return <ErrorScreen message="This secure link does not exist or has been permanently deleted." />;
    }
    if (shareRecord.revoked || shareRecord.document.revoked) {
        return <ErrorScreen message="Access to this document has been revoked by the administrator." />;
    }
    if (shareRecord.expiresAt && new Date() > shareRecord.expiresAt) {
        return <ErrorScreen message="The timer on this secure link has expired." />;
    }
    if (shareRecord.currentViews >= shareRecord.maxViews) {
        return <ErrorScreen message="This document has exceeded its maximum allowed views and self-destructed." />;
    }

    // --- THE UNLOCK ACTION & TRIPWIRE ---
    async function executeUnlock(clientToken: string) {
        "use server";

        // 1. Increment the view counter
        await prisma.recipientShare.update({
            where: { tokenHash: clientToken },
            data: { currentViews: { increment: 1 } },
        });

        // 2. Log the exact moment they opened it to the Dashboard
        await prisma.auditEvent.create({
            data: {
                documentId: shareRecord!.documentId,
                recipientShareId: shareRecord!.id,
                eventType: "DOCUMENT_DECRYPTED",
            }
        });

        // 3. 🔥 THE TEAM EMAIL FLARE (GMAIL RELAY HACK)
        try {
            const cleanFilename = shareRecord!.document.filename.split("-").slice(1).join("-") || shareRecord!.document.filename;

            await resend.emails.send({
                from: "Vault Security <onboarding@resend.dev>",

                // 👇 PUT YOUR NEW GMAIL ADDRESS RIGHT HERE 👇
                to: "qcapital.vault.alerts@gmail.com",

                subject: `🚨 Vault Alert: Document Opened`,
                html: `
                    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
                            <h2 style="margin: 0;">Secure Vault Activity</h2>
                        </div>
                        <div style="padding: 24px;">
                            <p style="font-size: 16px; color: #333;">A client has just decrypted a secure document from your vault.</p>
                            <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0 0 10px 0;"><strong>Recipient:</strong> ${shareRecord!.recipientEmail}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Document:</strong> ${cleanFilename}</p>
                                <p style="margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} (EST)</p>
                            </div>
                            <p style="font-size: 14px; color: #666; margin-top: 30px;">
                                This is an automated security notification. You can view the full audit trail on your dashboard.
                            </p>
                        </div>
                    </div>
                `
            });
        } catch (error) {
            console.error("Email flare failed to launch:", error);
        }

        // 4. Request a 60-second read-only token from AWS S3
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: shareRecord!.document.filename,
        });

        const readUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        // 5. Instantly redirect the client directly to the AWS file stream
        redirect(readUrl);
    }

    // --- CLIENT UI ---
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Document Transfer</h1>
                <p className="text-gray-500 text-sm mb-8">
                    Intended solely for <span className="font-semibold text-gray-900">{shareRecord.recipientEmail}</span>.
                    <br/> Views remaining: {shareRecord.maxViews - shareRecord.currentViews}
                </p>

                <UnlockButton token={token} onUnlock={executeUnlock} />

            </div>
        </div>
    );
}

function ErrorScreen({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
                <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
}