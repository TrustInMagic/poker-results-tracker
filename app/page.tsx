// app/page.tsx
import { getPokerData } from './actions';
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
}

export default async function Page() {
  const data = await getPokerData();
  return <DashboardClient initialData={data as DashboardData} />;
}
