import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await req.json();

        // 2. Fetch the user profile to enforce ownership rules
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
        });

        // 3. Find the document
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        // SECURITY FIREWALL: Prevent users from revoking documents they don't own
        if (!document || document.ownerId !== dbUser?.id) {
            return NextResponse.json({ error: "Action forbidden. Ownership verification failed." }, { status: 403 });
        }

        // 4. Throw the Master Kill Switch
        await prisma.document.update({
            where: { id: documentId },
            data: { revoked: true }, // This instantly kills ALL active share links for this file
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Kill Switch Execution Error:", error);
        return NextResponse.json({ error: "Failed to execute revocation protocol" }, { status: 500 });
    }
}