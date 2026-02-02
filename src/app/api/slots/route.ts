import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCases } from "@/lib/db";
import { listBusyTimes, listMultiBusyTimes } from "@/lib/google-calendar";
import { findFreeSlots } from "@/lib/slot-finder";
import { addDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });

    const caseData = getCases()[caseId];
    if (!caseData || caseData.userId !== session.user?.email) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const daysToSearch = parseInt(searchParams.get('days') || '5');
    const timeMin = startOfDay(new Date());
    const timeMax = addDays(timeMin, daysToSearch + 5); // Search a bit more to ensure we find enough week days

    try {
        const calendarIds = ['primary', ...(caseData.members || [])];
        const busyEvents = await listMultiBusyTimes(session.accessToken, timeMin, timeMax, calendarIds);
        const slots = findFreeSlots(busyEvents, {
            durationMinutes: caseData.duration,
            bufferMinutes: caseData.buffer,
            workingHourStart: 10,
            workingHourEnd: 19,
            lunchStart: 12,
            lunchEnd: 13,
            startDate: new Date(),
            daysToSearch: daysToSearch,
        });

        return NextResponse.json(slots);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
    }
}
