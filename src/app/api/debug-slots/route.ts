import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCases } from "@/lib/db";
import { getGoogleCalendarClient } from "@/lib/google-calendar";
import { findFreeSlots } from "@/lib/slot-finder";
import { addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });

    const cases = await getCases();
    const caseData = cases[caseId];
    if (!caseData || caseData.userId !== session.user?.email) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const daysToSearch = parseInt(searchParams.get('days') || '5');
    const now = new Date();
    const zonedNow = toZonedTime(now, 'Asia/Tokyo');
    zonedNow.setHours(0, 0, 0, 0);
    const timeMin = fromZonedTime(zonedNow, 'Asia/Tokyo');
    const timeMax = addDays(timeMin, daysToSearch + 5);

    const calendarIds = ['primary', ...(caseData.members || [])];

    try {
        const calendar = getGoogleCalendarClient(session.accessToken);
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                timeZone: 'Asia/Tokyo',
                items: calendarIds.map(id => ({ id })),
            },
        });

        // 各カレンダーの busy + errors を丸出し
        const calendarDetails: Record<string, { busy: string[], errors: unknown[] }> = {};
        const allBusySlots: { start: string; end: string }[] = [];
        const calendars = response.data.calendars || {};

        for (const id in calendars) {
            const cal = calendars[id];
            calendarDetails[id] = {
                busy: (cal.busy || []).map(b => `${b.start} ~ ${b.end}`),
                errors: cal.errors || [],
            };
            (cal.busy || []).forEach(b => {
                if (b.start && b.end) {
                    allBusySlots.push({ start: b.start, end: b.end });
                }
            });
        }

        // findFreeSlots も実行して結果も返す
        const busyEvents = allBusySlots.map(b => ({ start: new Date(b.start), end: new Date(b.end) }));
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

        return NextResponse.json({
            debug: {
                calendarIds,
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                caseData: {
                    duration: caseData.duration,
                    buffer: caseData.buffer,
                    maxSlots: caseData.maxSlots,
                    members: caseData.members,
                },
                daysToSearch,
            },
            calendarDetails,
            busyCount: allBusySlots.length,
            slotsFound: slots.length,
            slots: slots.map(s => ({
                start: s.start.toISOString(),
                end: s.end.toISOString(),
            })),
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
