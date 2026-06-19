import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
    // This physically deletes the cached HTML for the dashboard
    revalidatePath("/dashboard");
    return NextResponse.json({ success: true, message: "Dashboard cache completely cleared!" });
}