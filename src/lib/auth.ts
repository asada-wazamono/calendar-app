import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Google のトークンリフレッシュ用
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
    try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                refresh_token: refreshToken,
            }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (user.email?.endsWith("@waza-mono.jp")) {
                return true;
            }
            return "/login?error=InvalidDomain";
        },
        async jwt({ token, account }) {
            // 初回ログイン時にトークンと有効期限を保存
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.accessTokenExpires = Date.now() + ((account.expires_in as number) ?? 3600) * 1000;
                return token;
            }

            // トークンがまだ有効なら何もしない
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            // トークンが切れたらリフレッシュする
            if (token.refreshToken) {
                const refreshed = await refreshAccessToken(token.refreshToken as string);
                if (refreshed) {
                    token.accessToken = refreshed.access_token;
                    token.accessTokenExpires = Date.now() + refreshed.expires_in * 1000;
                    return token;
                }
            }

            // リフレッシュ失敗 → エラーフラグを立てる
            return { ...token, error: "RefreshAccessTokenError" };
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            if (token.error) {
                session.error = token.error as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        error?: string;
    }
}
