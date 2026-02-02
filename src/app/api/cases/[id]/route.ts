import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCases, deleteCase } from "@/lib/db";
import { deleteEvent } from "@/lib/google-calendar";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const cases = getCases();
    const caseData = cases[id];

    if (!caseData || caseData.userId !== session.user?.email) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    try {
        console.log(`Attempting to delete case: ${id}`);
        // Delete provisional events if any
        if (caseData.provisionalEventIds && caseData.provisionalEventIds.length > 0) {
            for (const eventId of caseData.provisionalEventIds) {
                try {
                    await deleteEvent(session.accessToken, eventId);
                } catch (e) {
                    console.warn(`Failed to delete provisional event ${eventId}:`, e);
                }
            }
        }

        deleteCase(id);
        console.log(`Case deleted successfully: ${id}`);
        return NextResponse.json({ success: true, message: "Case and associated events deleted" });
    } catch (error: any) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete case", details: error.message }, { status: 500 });
    }
}
