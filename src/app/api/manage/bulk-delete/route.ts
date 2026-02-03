import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { listProvisionalEvents, deleteEvent } from "@/lib/google-calendar";
import { getCases, saveCase, deleteCase } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    try {
        const events = await listProvisionalEvents(session.accessToken);
        let filtered = events;
        if (from || to) {
            filtered = events.filter(e => {
                const start = e.start?.dateTime || e.start?.date;
                if (!start) return false;
                if (from && new Date(start) < new Date(from)) return false;
                if (to && new Date(start) > new Date(to)) return false;
                return true;
            });
        }

        for (const ev of filtered) {
            try {
                await deleteEvent(session.accessToken, ev.id!);
            } catch (e) {
                console.warn(`Failed to delete event ${ev.id}:`, e);
            }
        }

        // Cleanup DB
        const allCases = await getCases();
        for (const id of Object.keys(allCases)) {
            const c = allCases[id];
            if (c.userId === session.user?.email && c.status === 'provisional') {
                const remaining = (c.provisionalEventIds || []).filter(eid => !filtered.some(e => e.id === eid));
                if (remaining.length === 0) {
                    await deleteCase(id);
                } else if (remaining.length !== (c.provisionalEventIds || []).length) {
                    c.provisionalEventIds = remaining;
                    await saveCase(c);
                }
            }
        }

        return NextResponse.json({ success: true, count: filtered.length });
    } catch (error) {
        console.error("Bulk Delete Error:", error);
        return NextResponse.json({ error: "Failed to bulk delete" }, { status: 500 });
    }
}