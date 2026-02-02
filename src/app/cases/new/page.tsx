'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCase() {
    const [name, setName] = useState('');
    const [duration, setDuration] = useState(60);
    const [maxSlots, setMaxSlots] = useState(3);
    const [days, setDays] = useState(5);
    const [travelBuffer, setTravelBuffer] = useState(false);
    const [members, setMembers] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const PRESET_MEMBERS = [
        { name: '羽織', email: 'haori@waza-mono.jp' },
        { name: '松崎', email: 'matsuzaki@waza-mono.jp' },
        { name: '笠', email: 'ryu@waza-mono.jp' },
        { name: '三浦', email: 'miura@waza-mono.jp' },
        { name: '手島', email: 'tejima@waza-mono.jp' },
        { name: '松本', email: 'matsumoto@waza-mono.jp' },
        { name: '渡邉', email: 'watanabe@waza-mono.jp' },
        { name: '作内', email: 'sakuuchi@waza-mono.jp' },
        { name: '藏', email: 'kura@waza-mono.jp' },
        { name: '浅田', email: 'asada@waza-mono.jp' },
    ];

    const toggleMember = (email: string) => {
        const currentMembers = members.split(',').map(m => m.trim()).filter(m => m !== '');
        if (currentMembers.includes(email)) {
            setMembers(currentMembers.filter(m => m !== email).join(', '));
        } else {
            setMembers([...currentMembers, email].join(', '));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    duration,
                    maxSlots,
                    buffer: travelBuffer ? 60 : 0,
                    members: members.split(',').map(m => m.trim()).filter(m => m !== ''),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/cases/${data.id}/candidates?days=${days}`);
            }
        } catch {
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>案件の新規作成</h1>
            <form onSubmit={handleSubmit} className="card glass animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>案件名</label>
                    <input
                        type="text"
                        placeholder="例: 【打合せ】プロジェクト進捗"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>会議時間 (分)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            min="15"
                            step="15"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>候補枠数</label>
                        <input
                            type="number"
                            value={maxSlots}
                            onChange={(e) => setMaxSlots(parseInt(e.target.value))}
                            min="1"
                            max="10"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>対象期間 (営業日数)</label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        min="1"
                        max="14"
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        同席メンバーの選択（waza-monoメンバー等）
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {PRESET_MEMBERS.map(m => (
                            <label key={m.email} className="glass" style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                border: members.includes(m.email) ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                background: members.includes(m.email) ? 'rgba(0, 120, 255, 0.1)' : 'transparent'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={members.includes(m.email)}
                                    onChange={() => toggleMember(m.email)}
                                    style={{ width: 'auto', display: 'none' }}
                                />
                                {m.name}
                            </label>
                        ))}
                    </div>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        その他のメールアドレス (カンマ区切り)
                    </label>
                    <input
                        type="text"
                        placeholder="example1@company.com, example2@company.com"
                        value={members}
                        onChange={(e) => setMembers(e.target.value)}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        ※自分の予定に加えて、入力した全員の空き時間を考慮します
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                        type="checkbox"
                        id="travel"
                        checked={travelBuffer}
                        onChange={(e) => setTravelBuffer(e.target.checked)}
                        style={{ width: 'auto' }}
                    />
                    <label htmlFor="travel" style={{ fontWeight: 600 }}>往訪あり (前後60分のバッファを確保)</label>
                </div>

                <button type="submit" className="primary" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? '候補を生成中...' : '候補を生成する'}
                </button>
            </form>
        </div>
    );
}
