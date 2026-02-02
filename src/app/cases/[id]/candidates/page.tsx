'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function Candidates() {
    const { data: session } = useSession();
    const { id } = useParams();
    const searchParams = useSearchParams();
    const days = searchParams.get('days') || '5';
    const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/slots?caseId=${id}&days=${days}`)
            .then(res => res.json())
            .then(data => {
                // Ensure data is an array
                if (Array.isArray(data)) {
                    setSlots(data);
                } else {
                    console.error('API returned non-array data:', data);
                    setSlots([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch slots:', err);
                setSlots([]);
                setLoading(false);
            });
    }, [id, days]);

    const handleToggle = (index: number) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const handleCreateProvisional = async () => {
        setProcessing(true);
        const selectedSlots = selectedIndices.map(i => slots[i]);

        try {
            const res = await fetch(`/api/cases/${id}/provisional`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slots: selectedSlots }),
            });

            if (res.ok) {
                router.push('/manage');
            }
        } catch {
            alert('エラーが発生しました');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="container">候補を抽出中...</div>;

    return (
        <div className="container">
            <h1 style={{ marginBottom: '1rem' }}>候補日時の選択</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                仮押さえとしてカレンダーに登録する枠を選択してください。連続した空き時間でまとめて表示しています。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {slots.map((slot, index) => {
                    const start = new Date(slot.start);
                    const end = new Date(slot.end);
                    const isSelected = selectedIndices.includes(index);
                    const durationHours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                    const durationMinutes = Math.floor(((end.getTime() - start.getTime()) / (1000 * 60)) % 60);

                    return (
                        <div
                            key={index}
                            className={`card glass ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggle(index)}
                            style={{
                                cursor: 'pointer',
                                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                background: isSelected ? 'var(--primary-glow)' : 'var(--glass)'
                            }}
                        >
                            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                                {format(start, 'MM/dd (E)', { locale: ja })}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                                {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                                {durationHours > 0 && `${durationHours}時間`}
                                {durationMinutes > 0 && `${durationMinutes}分`}
                            </div>
                        </div>
                    );
                })}
            </div>

            {slots.length === 0 && <p>候補が見つかりませんでした。条件を変えてやり直してください。</p>}

            {/* Google Calendar Embed */}
            <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>カレンダー確認</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    念のため、実際のカレンダーで予定を確認できます。
                </p>
                <div style={{
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    height: '600px'
                }}>
                    <iframe
                        src={`https://calendar.google.com/calendar/embed?src=${session?.user?.email ? encodeURIComponent(session.user.email) : ''}&ctz=Asia/Tokyo&mode=WEEK&showTitle=0&showNav=1&showPrint=0&showCalendars=0`}
                        style={{
                            border: 0,
                            width: '100%',
                            height: '100%',
                            background: 'white'
                        }}
                        frameBorder="0"
                        scrolling="no"
                    />
                </div>
            </div>

            <div style={{ position: 'sticky', bottom: '2rem', display: 'flex', gap: '1rem', background: 'var(--background)', padding: '1rem 0' }}>
                <button
                    className="primary"
                    disabled={selectedIndices.length === 0 || processing}
                    onClick={handleCreateProvisional}
                    style={{ flex: 1 }}
                >
                    {processing ? '登録中...' : `${selectedIndices.length}件を仮押さえとして登録`}
                </button>
                <button onClick={() => router.back()} style={{ background: 'var(--secondary)', color: 'white' }}>
                    戻る
                </button>
            </div>
        </div>
    );
}
