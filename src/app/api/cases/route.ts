import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCases, saveCase, Case } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const allCases = getCases();

    if (id) {
        const c = allCases[id];
        if (!c || c.userId !== session.user.email) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(c);
    }

    const userCases = Object.values(allCases).filter(c => c.userId === session.user?.email);
    return NextResponse.json(userCases);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const newCase: Case = {
        id: uuidv4(),
        userId: session.user.email,
        name: body.name || "無題の案件",
        duration: body.duration || 60,
        buffer: body.buffer || 0,
        maxSlots: body.maxSlots || 3,
        status: 'draft',
        members: body.members || [],
        createdAt: new Date().toISOString(),
    };

    saveCase(newCase);
    return NextResponse.json(newCase);
}
