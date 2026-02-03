import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCases } from "@/lib/db";
import { listMultiBusyTimes, listEventsInRange } from "@/lib/google-calendar";
import { findFreeSlots } from "@/lib/slot-finder";
import { addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });

    const cases = await getCases();  // ← await 追加 & 変数に分離
    const caseData = cases[caseId];
    if (!caseData || caseData.userId !== session.user?.email) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const daysToSearch = parseInt(searchParams.get('days') || '5');
    const now = new Date();
    const zonedNow = toZonedTime(now, 'Asia/Tokyo');
    zonedNow.setHours(0, 0, 0, 0);
    const timeMin = fromZonedTime(zonedNow, 'Asia/Tokyo');
    const timeMax = addDays(timeMin, daysToSearch + 5); // Search a bit more to ensure we find enough week days

    try {
        const calendarIds = ['primary', ...(caseData.members || [])];
        const busyEvents = await listMultiBusyTimes(session.accessToken, timeMin, timeMax, calendarIds);

        // 往訪バッファ：タイトルに「往訪」が含まれる予定の前後に60分を追加して busy に混ぜる
        if (caseData.buffer > 0) {
            const myEvents = await listEventsInRange(session.accessToken, timeMin, timeMax);
            myEvents.forEach(ev => {
                if (ev.summary?.includes('往訪') && ev.start?.dateTime && ev.end?.dateTime) {
                    const evStart = new Date(ev.start.dateTime);
                    const evEnd = new Date(ev.end.dateTime);
                    // 予定の前に60分バッファ
                    busyEvents.push({
                        start: new Date(evStart.getTime() - caseData.buffer * 60 * 1000),
                        end: evStart,
                    });
                    // 予定の後に60分バッファ
                    busyEvents.push({
                        start: evEnd,
                        end: new Date(evEnd.getTime() + caseData.buffer * 60 * 1000),
                    });
                }
            });
        }

        const slots = findFreeSlots(busyEvents, {
            durationMinutes: caseData.duration,
            bufferMinutes: 0, // バッファは上で予定として混ぜ済みなので常に0
            workingHourStart: 10,
            workingHourEnd: 19,
            lunchStart: 12,
            lunchEnd: 13,
            startDate: new Date(),
            daysToSearch: daysToSearch,
        });

        // maxSlots で表示する候補数を制限する（日程が偏らないよう、1日あたり最大2枠まで）
        const limited: typeof slots = [];
        const perDayCount: Record<string, number> = {};
        for (const slot of slots) {
            if (limited.length >= caseData.maxSlots) break;
            const dayKey = slot.start.toISOString().slice(0, 10);
            perDayCount[dayKey] = (perDayCount[dayKey] || 0) + 1;
            if (perDayCount[dayKey] <= 2) {
                limited.push(slot);
            }
        }

        return NextResponse.json(limited);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
    }
}