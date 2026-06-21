import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 1. Authenticate
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
        }

        // 2. Find the file in Prisma
        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // 3. Generate the secure S3 link
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: document.filename,
        });

        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        return NextResponse.json({ downloadUrl });

    } catch (error) {
        console.error("S3 Secure View Error: ", error);
        return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
    }
}