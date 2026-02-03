import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Redirect from root to /cases/new if logged in
    if (path === '/') {
        const session = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (session) {
            return NextResponse.redirect(new URL('/cases/new', req.url));
        }
    }

    return NextResponse.next();
}

// middleware.ts

/* 一時的にコメントアウトして動作確認
export const config = {
    matcher: ['/'],
};
*/
