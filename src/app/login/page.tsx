'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function LoginContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    useEffect(() => {
        if (session) {
            router.push('/cases/new');
        }
    }, [session, router]);

    if (status === 'loading') {
        return <div className="container">読み込み中...</div>;
    }

    return (
        <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>G-Cal 仮押さえ君</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                ログインしてカレンダー管理を始めましょう。
            </p>

            {error === 'InvalidDomain' && (
                <div style={{
                    color: '#ff4444',
                    marginBottom: '1.5rem',
                    background: 'rgba(255, 0, 0, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    maxWidth: '400px',
                    margin: '0 auto 1.5rem'
                }}>
                    <strong>アクセスエラー:</strong><br />
                    waza-mono.jp ドメインのGoogleアカウントのみログイン可能です。
                </div>
            )}

            <div className="card glass animate-fade-in" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
                <button
                    className="primary"
                    onClick={() => signIn('google', { callbackUrl: '/cases/new' })}
                    style={{ width: '100%' }}
                >
                    Googleでログイン
                </button>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ※waza-mono.jp アカウントのみログイン可能です
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="container">読み込み中...</div>}>
            <LoginContent />
        </Suspense>
    );
}
