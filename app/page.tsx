// app/page.tsx
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export interface PokerSession {
  id: string;
  date: Date;
  stake: string;
  startingBalance: number;
  endingBalance: number;
  hoursPlayed: number;
  notes: string | null;
}

export interface RakebackEntry {
  id: string;
  date: Date;
  amount: number;
  notes: string | null;
}

export interface DashboardData {
  sessions: PokerSession[];
  rakebacks: RakebackEntry[];
  customMonths: string[];
}

export default async function Page() {
  const [sessions, rakebacks, dbMonths] = await Promise.all([
    prisma.pokerSession.findMany({ orderBy: { date: 'desc' } }),
    prisma.rakebackEntry.findMany({ orderBy: { date: 'desc' } }),
    prisma.month.findMany(),
  ]);

  const customMonths = dbMonths.map((m) => m.name);

  const data: DashboardData = {
    sessions,
    rakebacks,
    customMonths,
  };

  return <DashboardClient initialData={data} />;
}
