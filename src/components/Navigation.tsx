'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <nav className="glass" style={{
            margin: '1rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: '1rem',
            zIndex: 100,
            border: '1px solid var(--glass-border)'
        }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <Link href="/" style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textDecoration: 'none'
                }}>
                    G-Cal 仮押さえ君
                </Link>
                {session && (
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link href="/manage" style={{
                            color: pathname === '/manage' ? 'var(--primary)' : 'var(--text)',
                            fontWeight: pathname === '/manage' ? 600 : 400,
                            textDecoration: 'none',
                            fontSize: '0.95rem'
                        }}>
                            案件管理
                        </Link>
                        <Link href="/cases/new" style={{
                            color: pathname === '/cases/new' ? 'var(--primary)' : 'var(--text)',
                            fontWeight: pathname === '/cases/new' ? 600 : 400,
                            textDecoration: 'none',
                            fontSize: '0.95rem'
                        }}>
                            新規作成
                        </Link>
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {session ? (
                    <>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {session.user?.email}
                        </span>
                        <button
                            onClick={() => signOut()}
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.8rem',
                                background: 'rgba(255, 0, 0, 0.1)',
                                color: '#ff4444',
                                border: '1px solid rgba(255, 0, 0, 0.2)'
                            }}
                        >
                            ログアウト
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => signIn('google')}
                        style={{
                            padding: '0.4rem 1rem',
                            fontSize: '0.9rem',
                            background: 'var(--primary)',
                            color: 'white'
                        }}
                    >
                        ログイン
                    </button>
                )}
            </div>
        </nav>
    );
}
