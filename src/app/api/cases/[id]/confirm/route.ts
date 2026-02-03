import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCases, saveCase } from "@/lib/db";
import { createConfirmedEvent, deleteEvent, listProvisionalEvents } from "@/lib/google-calendar";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { start, end } = body;

    const cases = await getCases();  // ← await 追加 & 変数に分離
    const caseData = cases[id];
    if (!caseData || caseData.userId !== session.user?.email) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    try {
        // 1. Find and delete all provisional events for this case
        const events = await listProvisionalEvents(session.accessToken, id);
        for (const event of events) {
            try {
                if (event.id) await deleteEvent(session.accessToken, event.id);
            } catch (e) {
                console.warn(`Failed to delete provisional event ${event.id}:`, e);
            }
        }

        // 2. Create confirmed event with Google Meet
        const confirmedEvent = await createConfirmedEvent(
            session.accessToken,
            new Date(start),
            new Date(end),
            caseData.name,
            caseData.members || []
        );

        caseData.status = 'confirmed';
        caseData.confirmedEventId = confirmedEvent.id!;
        caseData.provisionalEventIds = []; // Clear them out
        await saveCase(caseData);  // ← await 追加

        return NextResponse.json({ success: true, confirmedEvent });
    } catch (error) {
        console.error("Confirmation Error:", error);
        return NextResponse.json({ error: "Failed to confirm event" }, { status: 500 });
    }
}