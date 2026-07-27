// lib/utils.ts

export interface PokerSession {
  id: string;
  date: Date | string;
  stake: string;
  startingBalance: number;
  endingBalance: number;
  hoursPlayed: number;
}

export interface StakeStat {
  stake: string;
  netWinnings: number;
  totalHours: number;
  hourlyRate: number;
}

/**
 * Calculates net profit, total hours, and hourly rates per stake,
 * distributing total rakeback proportionally based on hours played.
 */
export function calculateStakeStats(
  sessions: PokerSession[],
  totalRakeback: number,
): StakeStat[] {
  const stakeMap: Record<string, { totalProfit: number; totalHours: number }> =
    {};
  let totalSessionHours = 0;

  // 1. Calculate raw session profits and total hours per stake
  sessions.forEach((s) => {
    const profit = s.endingBalance - s.startingBalance;
    totalSessionHours += s.hoursPlayed;

    if (!stakeMap[s.stake]) {
      stakeMap[s.stake] = { totalProfit: 0, totalHours: 0 };
    }
    stakeMap[s.stake].totalProfit += profit;
    stakeMap[s.stake].totalHours += s.hoursPlayed;
  });

  // 2. Distribute Rakeback proportionally based on hours played at each stake
  return Object.entries(stakeMap).map(([stake, data]) => {
    const hourlyWeight =
      totalSessionHours > 0 ? data.totalHours / totalSessionHours : 0;
    const allocatedRakeback = totalRakeback * hourlyWeight;
    const netWinnings = data.totalProfit + allocatedRakeback;
    const hourlyRate = data.totalHours > 0 ? netWinnings / data.totalHours : 0;

    return {
      stake,
      netWinnings,
      totalHours: data.totalHours,
      hourlyRate,
    };
  });
}
