'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ConfirmPage() {
    const { id } = useParams();
    const [provisionalEvents, setProvisionalEvents] = useState<any[]>([]);
    const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [manualStartTime, setManualStartTime] = useState('10:00');
    const [manualEndTime, setManualEndTime] = useState('11:00');

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/cases?id=${id}`)
            .then(res => res.json())
            .then(data => {
                fetch(`/api/cases/${id}/provisional-times`)
                    .then(res => res.json())
                    .then(times => {
                        if (Array.isArray(times)) {
                            setProvisionalEvents(times);
                        } else {
                            console.error('Invalid times response:', times);
                            setProvisionalEvents([]);
                        }
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error('Fetch times error:', err);
                        setProvisionalEvents([]);
                        setLoading(false);
                    });
            })
            .catch(err => {
                console.error('Fetch case error:', err);
                setLoading(false);
            });
    }, [id]);

    const handleConfirm = async (event: { start: string | Date; end: string | Date }) => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/cases/${id}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: typeof event.start === 'string' ? event.start : event.start.toISOString(),
                    end: typeof event.end === 'string' ? event.end : event.end.toISOString()
                }),
            });

            if (res.ok) {
                router.push('/manage');
            }
        } catch (e) {
            alert('確定に失敗しました');
        } finally {
            setProcessing(false);
        }
    };

    const handleManualConfirm = async () => {
        const start = new Date(`${manualDate}T${manualStartTime}:00`);
        const end = new Date(`${manualDate}T${manualEndTime}:00`);
        await handleConfirm({ start, end });
    };

    if (loading) return <div className="container">仮予定を取得中...</div>;

    return (
        <div className="container">
            <h1>日程の確定</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                確定する日時を選択してください。選択した日時以外はカレンダーから自動削除されます。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {provisionalEvents.length > 0 ? (
                    provisionalEvents.map((ev, index) => (
                        <div key={index} className="card glass animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                                    {format(new Date(ev.start), 'MM/dd (E)', { locale: ja })}
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    {format(new Date(ev.start), 'HH:mm')} - {format(new Date(ev.end), 'HH:mm')}
                                </div>
                            </div>
                            <button className="primary" onClick={() => handleConfirm(ev)} disabled={processing}>
                                {processing ? '確定処理中...' : 'この日時で確定'}
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="card glass animate-fade-in" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>候補予定が見つかりません</p>
                        <p style={{ fontSize: '0.9rem' }}>以下の手入力フォームから日程を確定してください</p>
                    </div>
                )}
            </div>

            <div className="card glass" style={{ border: '2px dashed var(--glass-border)' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>手入力で日時を指定する</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>日付</label>
                        <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>開始時間</label>
                        <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>終了時間</label>
                        <input type="time" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} />
                    </div>
                </div>
                <button
                    onClick={handleManualConfirm}
                    disabled={processing}
                    style={{ width: '100%', background: 'var(--secondary)', border: '1px solid var(--primary)' }}
                >
                    {processing ? '確定処理中...' : '手入力した日時で確定する'}
                </button>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                    ※こちらで確定した場合も、案件に関連する全ての仮予定は削除されます
                </p>
            </div>
        </div>
    );
}
