import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
});

export interface Case {
    id: string;
    userId: string;
    name: string;
    duration: number;
    buffer: number;
    maxSlots: number;
    status: 'draft' | 'provisional' | 'confirmed';
    members?: string[];
    provisionalEventIds?: string[];
    confirmedEventId?: string;
    createdAt: string;
}

export const getCases = async (): Promise<Record<string, Case>> => {
    const cases = await redis.get<Record<string, Case>>('cases');
    return cases || {};
};

export const saveCase = async (caseData: Case) => {
    const cases = await getCases();
    cases[caseData.id] = caseData;
    await redis.set('cases', cases);
};

export const deleteCase = async (id: string) => {
    const cases = await getCases();
    delete cases[id];
    await redis.set('cases', cases);
};