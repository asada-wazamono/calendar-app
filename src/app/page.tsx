'use client';

export const dynamic = 'force-dynamic';

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/cases/new');
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return <div className="container">読み込み中...</div>;
  }

  if (!session) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>G-Cal 仮押さえ君</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Googleカレンダーの空き時間を自動抽出し、候補日程をスマートに管理します。
        </p>
        <button className="primary" onClick={() => signIn("google")}>
          Googleでログインして始める
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1>ダッシュボード</h1>
          <p style={{ color: 'var(--text-muted)' }}>ようこそ、{session?.user?.name || 'ゲスト'} さん</p>
        </div>
        <button onClick={() => signOut()} style={{ background: 'var(--secondary)', color: 'white' }}>
          ログアウト
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Link href="/cases/new" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card glass animate-fade-in" style={{ height: '100%', cursor: 'pointer' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>新しく候補を出す</h2>
            <p style={{ color: 'var(--text-muted)' }}>カレンダーから空き時間を探し、仮押さえ予定を作成します。</p>
          </div>
        </Link>
        <Link href="/manage" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card glass animate-fade-in" style={{ height: '100%', cursor: 'pointer', animationDelay: '0.1s' }}>
            <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>仮押さえ管理</h2>
            <p style={{ color: 'var(--text-muted)' }}>作成済みの仮押さえ一覧を確認・削除・確定します。</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
