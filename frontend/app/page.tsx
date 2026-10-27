import { Suspense } from 'react';
import { connection } from 'next/server';
import MediNestApp from './medinest-app';

async function RequestTimeApp() {
  await connection();
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);

  return (
    <MediNestApp
      today={today}
      currentYear={now.getFullYear()}
      nowTimestamp={now.getTime()}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" aria-busy="true" />}>
      <RequestTimeApp />
    </Suspense>
  );
}
