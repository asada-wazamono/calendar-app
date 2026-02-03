import {
    addMinutes,
    isBefore,
    isAfter,
    isWithinInterval,
    addDays,
    isWeekend,
    differenceInMinutes,
    max
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Tokyo';

// 東京時間で指定した時刻の Date を返す
const setTimeInTokyo = (date: Date, hours: number, minutes: number): Date => {
    const zoned = toZonedTime(date, TIMEZONE);
    zoned.setHours(hours, minutes, 0, 0);
    return fromZonedTime(zoned, TIMEZONE);
};

// 東京時間での日の開始（00:00 東京時間）を返す
const startOfDayInTokyo = (date: Date): Date => {
    const zoned = toZonedTime(date, TIMEZONE);
    zoned.setHours(0, 0, 0, 0);
    return fromZonedTime(zoned, TIMEZONE);
};

export interface Slot {
    start: Date;
    end: Date;
}

export interface FinderOptions {
    durationMinutes: number;
    bufferMinutes: number;
    workingHourStart: number; // e.g. 10
    workingHourEnd: number;   // e.g. 19
    lunchStart: number;       // e.g. 12
    lunchEnd: number;         // e.g. 13
    startDate: Date;
    daysToSearch: number;
}

export const findFreeSlots = (
    busyEvents: { start: Date; end: Date }[],
    options: FinderOptions
): Slot[] => {
    const candidates: Slot[] = [];
    let currentDay = startOfDayInTokyo(addDays(options.startDate, 1)); // Start from tomorrow
    let daysFound = 0;

    while (daysFound < options.daysToSearch) {
        if (!isWeekend(toZonedTime(currentDay, TIMEZONE))) {
            const dayStart = setTimeInTokyo(currentDay, options.workingHourStart, 0);
            const dayEnd = setTimeInTokyo(currentDay, options.workingHourEnd, 0);
            const lunchStart = setTimeInTokyo(currentDay, options.lunchStart, 0);
            const lunchEnd = setTimeInTokyo(currentDay, options.lunchEnd, 0);

            // Create "exclusion periods" for this day (busy events + lunch)
            const exclusions = [
                { start: lunchStart, end: lunchEnd },
                ...busyEvents.filter(e =>
                    isWithinInterval(e.start, { start: dayStart, end: dayEnd }) ||
                    isWithinInterval(e.end, { start: dayStart, end: dayEnd }) ||
                    (isBefore(e.start, dayStart) && isAfter(e.end, dayEnd))
                )
            ].sort((a, b) => a.start.getTime() - b.start.getTime());

            // 空き枠を見つけて、その中から durationMinutes 刻みで候補を生成する
            const addCandidatesFromBlock = (blockStart: Date, blockEnd: Date) => {
                // バッファは移動時間なので、空き枠の先頭だけに適用（前の予定の後に移動する）
                const effectiveStart = addMinutes(blockStart, options.bufferMinutes);

                // effectiveStart から durationMinutes ごとに候補を並べる
                let slotStart = effectiveStart;
                while (differenceInMinutes(blockEnd, slotStart) >= options.durationMinutes) {
                    candidates.push({
                        start: slotStart,
                        end: addMinutes(slotStart, options.durationMinutes),
                    });
                    slotStart = addMinutes(slotStart, options.durationMinutes);
                }
            };

            let freeBlockStart = dayStart;

            for (const exclusion of exclusions) {
                if (isBefore(freeBlockStart, exclusion.start)) {
                    addCandidatesFromBlock(freeBlockStart, exclusion.start);
                }
                freeBlockStart = max([freeBlockStart, exclusion.end]);
            }

            // 最後の除外時間の後〜営業時間終了まで
            if (isBefore(freeBlockStart, dayEnd)) {
                addCandidatesFromBlock(freeBlockStart, dayEnd);
            }

            daysFound++;
        }
        currentDay = addDays(currentDay, 1);
    }

    return candidates;
};
