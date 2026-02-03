import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export const getGoogleCalendarClient = (accessToken: string) => {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth });
};

export interface CalendarEvent {
    id: string;
    start: Date;
    end: Date;
    summary: string;
}

export const listBusyTimes = async (accessToken: string, timeMin: Date, timeMax: Date) => {
    return listMultiBusyTimes(accessToken, timeMin, timeMax, ['primary']);
};

export const listMultiBusyTimes = async (
    accessToken: string,
    timeMin: Date,
    timeMax: Date,
    calendarIds: string[]
) => {
    const calendar = getGoogleCalendarClient(accessToken);
    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            timeZone: 'Asia/Tokyo',  // ← これを追加
            items: calendarIds.map(id => ({ id })),
        },
    });

    const busySlots: { start: Date; end: Date }[] = [];
    const calendars = response.data.calendars || {};

    for (const id in calendars) {
        const busy = calendars[id].busy || [];
        busy.forEach(b => {
            if (b.start && b.end) {
                busySlots.push({
                    start: new Date(b.start),
                    end: new Date(b.end),
                });
            }
        });
    }

    return busySlots;
};

export const createProvisionalEvent = async (
    accessToken: string,
    start: Date,
    end: Date,
    caseId: string,
    members: string[] = []
) => {
    const calendar = getGoogleCalendarClient(accessToken);
    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
            summary: `【仮】打合せ候補`,
            description: `AG_CASE_ID=${caseId}\n(Antigravity Generated)`,
            start: { dateTime: start.toISOString(), timeZone: 'Asia/Tokyo' },
            end: { dateTime: end.toISOString(), timeZone: 'Asia/Tokyo' },
            colorId: '5', // Yellow/Banana color for visibility
            attendees: members.map(email => ({ email, optional: true })),
        },
    });
    return response.data;
};

export const createConfirmedEvent = async (
    accessToken: string,
    start: Date,
    end: Date,
    summary: string,
    members: string[] = []
) => {
    const calendar = getGoogleCalendarClient(accessToken);
    const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
            summary: summary,
            start: { dateTime: start.toISOString(), timeZone: 'Asia/Tokyo' },
            end: { dateTime: end.toISOString(), timeZone: 'Asia/Tokyo' },
            conferenceData: {
                createRequest: {
                    requestId: Math.random().toString(36).substring(7),
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
            attendees: members.map(email => ({ email })),
        },
    });
    return response.data;
};

export const deleteEvent = async (accessToken: string, eventId: string) => {
    const calendar = getGoogleCalendarClient(accessToken);
    await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
    });
};

export const listProvisionalEvents = async (accessToken: string, caseId?: string) => {
    try {
        const calendar = getGoogleCalendarClient(accessToken);
        const response = await calendar.events.list({
            calendarId: 'primary',
            q: '【仮】', // Search for provisional events
            singleEvents: true,
        });

        let items = response.data.items || [];
        if (caseId) {
            items = items.filter(e => e.description?.includes(`AG_CASE_ID=${caseId}`));
        } else {
            items = items.filter(e => e.description?.includes(`AG_CASE_ID=`));
        }

        return items;
    } catch (error) {
        console.error("List Provisional Events Error:", error);
        throw error;
    }
};
