import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { listProvisionalEvents } from "@/lib/google-calendar";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const events = await listProvisionalEvents(session.accessToken, id);
        const times = events.map(e => ({
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
        }));

        return NextResponse.json(times);
    } catch (error: unknown) {
        console.error("Provisional Times API Error:", error);
        return NextResponse.json({
            error: "Failed to fetch provisional times",
            details: (error as Error).message || String(error)
        }, { status: 500 });
    }
}
