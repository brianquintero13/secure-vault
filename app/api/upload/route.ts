import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const { filename, contentType, size } = await req.json();
        if (!filename || !contentType || !size) {
            return NextResponse.json({ error: "Missing file payload metadata" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User context identity missing" }, { status: 404 });
        }

        // 🔥 FIX: Strip out spaces and special characters for the AWS S3 URL string
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.]/g, "_");
        const fileKey = `vault/${uuidv4()}-${sanitizedFilename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        const document = await prisma.document.create({
            data: {
                filename: fileKey,
                ownerId: dbUser.id,
            },
        });

        return NextResponse.json({
            uploadUrl,
            documentId: document.id,
            fileKey,
        });

    } catch (error) {
        console.error("S3 Secure Presign Execution Error: ", error);
        return NextResponse.json({ error: "Failed to allocate cloud transmission tokens" }, { status: 500 });
    }
}