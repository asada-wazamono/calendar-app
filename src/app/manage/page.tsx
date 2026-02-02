'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';

interface Case {
    id: string;
    name: string;
    status: 'draft' | 'provisional' | 'confirmed';
    createdAt: string;
}

export default function Manage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [bulkConfirming, setBulkConfirming] = useState(false);

    const fetchCases = (silent = false) => {
        if (!silent) setLoading(true);
        fetch(`/api/cases?t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCases(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                } else {
                    console.error('Failed to fetch cases:', data);
                    setCases([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCases(false);
    }, []);

    const executeDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCases(prev => prev.filter(c => c.id !== id));
                setConfirmingId(null);
                fetchCases(true); // Sync with server backup
            } else {
                const data = await res.json();
                alert(`削除に失敗しました: ${data.error || '不明なエラー'}`);
            }
        } catch {
            alert('削除に失敗しました');
        }
    };

    const executeBulkDelete = async () => {
        try {
            const res = await fetch(`/api/manage/bulk-delete?t=${Date.now()}`, { method: 'DELETE' });
            if (res.ok) {
                alert('仮押さえの削除が完了しました');
                setBulkConfirming(false);
                fetchCases(true);
            } else {
                const data = await res.json();
                alert(`削除に失敗しました: ${data.error || '不明なエラー'}`);
            }
        } catch {
            alert('削除に失敗しました');
        }
    };

    if (loading) return <div className="container">読み込み中...</div>;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>案件管理</h1>
                    <p style={{ color: 'var(--text-muted)' }}>案件ごとの操作や一括削除が行えます。</p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    {bulkConfirming ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255, 0, 0, 0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255, 0, 0, 0.1)' }}>
                            <span style={{ fontSize: '0.85rem', color: '#ff4444', fontWeight: 600 }}>全削除しますか？</span>
                            <button type="button" onClick={executeBulkDelete} style={{ background: '#ff4444', color: 'white', padding: '0.3rem 0.8rem' }}>実行</button>
                            <button type="button" onClick={() => setBulkConfirming(false)} style={{ padding: '0.3rem 0.8rem' }}>やめる</button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setBulkConfirming(true)} style={{ background: 'var(--secondary)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                            すべての仮押さえを削除
                        </button>
                    )}
                    <Link href="/cases/new">
                        <button className="primary">新規作成</button>
                    </Link>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cases.map(c => (
                    <div key={c.id} className="card glass animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h3 style={{ margin: 0 }}>{c.name}</h3>
                                <span className={`badge ${c.status}`} style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    background: c.status === 'confirmed' ? 'var(--success)' : c.status === 'provisional' ? 'var(--warning)' : 'var(--secondary)',
                                    color: 'white'
                                }}>
                                    {c.status === 'confirmed' ? '確定済み' : c.status === 'provisional' ? '仮押さえ中' : '下書き'}
                                </span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                作成日: {format(new Date(c.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {c.status === 'provisional' && (
                                <Link href={`/cases/${c.id}/confirm`}>
                                    <button style={{ background: 'var(--primary)', color: 'white' }}>日程を確定する</button>
                                </Link>
                            )}
                            {confirmingId === c.id ? (
                                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <button type="button" onClick={() => executeDelete(c.id)} style={{ background: '#ff4444', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>削除実行</button>
                                    <button type="button" onClick={() => setConfirmingId(null)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>やめる</button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setConfirmingId(c.id)} style={{ background: 'var(--accent)', color: 'white' }}>削除</button>
                            )}
                        </div>
                    </div>
                ))}

                {cases.length === 0 && <p>まだ案件がありません。</p>}
            </div>
        </div>
    );
}
