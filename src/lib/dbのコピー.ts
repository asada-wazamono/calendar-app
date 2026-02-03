import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '.data', 'cases.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), '.data'))) {
    fs.mkdirSync(path.join(process.cwd(), '.data'));
}
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

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

export const getCases = (): Record<string, Case> => {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

export const saveCase = (caseData: Case) => {
    const cases = getCases();
    cases[caseData.id] = caseData;
    fs.writeFileSync(DB_PATH, JSON.stringify(cases, null, 2));
};

export const deleteCase = (id: string) => {
    const cases = getCases();
    delete cases[id];
    fs.writeFileSync(DB_PATH, JSON.stringify(cases, null, 2));
};
