import {
    addMinutes,
    isBefore,
    isAfter,
    isWithinInterval,
    startOfDay,
    setHours,
    setMinutes,
    addDays,
    isWeekend,
    differenceInMinutes,
    max,
    min
} from 'date-fns';

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
    let currentDay = startOfDay(addDays(options.startDate, 1)); // Start from tomorrow
    let daysFound = 0;

    while (daysFound < options.daysToSearch) {
        if (!isWeekend(currentDay)) {
            const dayStart = setMinutes(setHours(currentDay, options.workingHourStart), 0);
            const dayEnd = setMinutes(setHours(currentDay, options.workingHourEnd), 0);
            const lunchStart = setMinutes(setHours(currentDay, options.lunchStart), 0);
            const lunchEnd = setMinutes(setHours(currentDay, options.lunchEnd), 0);

            // Create "exclusion periods" for this day (busy events + lunch)
            const exclusions = [
                { start: lunchStart, end: lunchEnd },
                ...busyEvents.filter(e =>
                    isWithinInterval(e.start, { start: dayStart, end: dayEnd }) ||
                    isWithinInterval(e.end, { start: dayStart, end: dayEnd }) ||
                    (isBefore(e.start, dayStart) && isAfter(e.end, dayEnd))
                )
            ].sort((a, b) => a.start.getTime() - b.start.getTime());

            // Find continuous free blocks
            let freeBlockStart = dayStart;

            for (const exclusion of exclusions) {
                // If there's a gap before this exclusion
                if (isBefore(freeBlockStart, exclusion.start)) {
                    const blockEnd = exclusion.start;

                    // Apply buffer constraints
                    const bufferedStart = addMinutes(freeBlockStart, options.bufferMinutes);
                    const bufferedEnd = addMinutes(blockEnd, -options.bufferMinutes);

                    // Check if this block is long enough for the meeting
                    if (differenceInMinutes(bufferedEnd, bufferedStart) >= options.durationMinutes) {
                        candidates.push({
                            start: bufferedStart,
                            end: bufferedEnd
                        });
                    }
                }

                // Move the pointer to after this exclusion
                freeBlockStart = max([freeBlockStart, exclusion.end]);
            }

            // Check if there's free time after the last exclusion until end of day
            if (isBefore(freeBlockStart, dayEnd)) {
                const bufferedStart = addMinutes(freeBlockStart, options.bufferMinutes);
                const bufferedEnd = addMinutes(dayEnd, -options.bufferMinutes);

                if (differenceInMinutes(bufferedEnd, bufferedStart) >= options.durationMinutes) {
                    candidates.push({
                        start: bufferedStart,
                        end: bufferedEnd
                    });
                }
            }

            daysFound++;
        }
        currentDay = addDays(currentDay, 1);
    }

    return candidates;
};
