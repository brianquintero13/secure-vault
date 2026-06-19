import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        // 1. Authenticate user session
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        // 2. Extract configuration from frontend payload
        const { documentId, recipientEmail, expiresInHours, maxViews } = await req.json();

        if (!documentId || !recipientEmail) {
            return NextResponse.json({ error: "Missing document or recipient data" }, { status: 400 });
        }

        // 3. Compute time-based expiration window
        let expirationDate = null;
        if (expiresInHours) {
            expirationDate = new Date();
            expirationDate.setHours(expirationDate.getHours() + Number(expiresInHours));
        }

        // 4. Generate unique unguessable look-up token hash
        const uniqueToken = uuidv4();

        // 5. Write share record into the Neon Database
        const shareRecord = await prisma.recipientShare.create({
            data: {
                documentId: documentId,
                recipientEmail: recipientEmail,
                tokenHash: uniqueToken,
                maxViews: maxViews || 3, // Fallback limit parameter
                expiresAt: expirationDate,
            },
        });

        // 6. Build final public link structure
        const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const publicLink = `${appUrl}/view/${uniqueToken}`;

        return NextResponse.json({
            success: true,
            shareId: shareRecord.id,
            publicLink: publicLink,
            expiresAt: expirationDate
        });

    } catch (error) {
        console.error("Link Generation Engine Failure:", error);
        return NextResponse.json({ error: "Internal compilation error" }, { status: 500 });
    }
}