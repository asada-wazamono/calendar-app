import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCases, saveCase } from "@/lib/db";
import { createProvisionalEvent } from "@/lib/google-calendar";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { slots } = body; // Array of { start: string, end: string }

    const caseData = getCases()[id];
    if (!caseData || caseData.userId !== session.user?.email) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    try {
        const eventIds: string[] = [];
        for (const slot of slots) {
            const event = await createProvisionalEvent(
                session.accessToken,
                new Date(slot.start),
                new Date(slot.end),
                id
            );
            if (event.id) eventIds.push(event.id);
        }

        caseData.provisionalEventIds = eventIds;
        caseData.status = 'provisional';
        saveCase(caseData);

        return NextResponse.json({ success: true, eventIds });
    } catch (error) {
        console.error("Provisional Creation Error:", error);
        return NextResponse.json({ error: "Failed to create provisional events" }, { status: 500 });
    }
}
