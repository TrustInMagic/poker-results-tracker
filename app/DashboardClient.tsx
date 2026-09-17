// app/DashboardClient.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Trash2, Globe, Pencil } from 'lucide-react';
import {
  addSession,
  updateSession,
  addRakeback,
  deleteSession,
  deleteRakeback,
  addMonth,
  deleteMonth,
} from './actions';
import { DashboardData, PokerSession } from './page';
import {
  calculateStakeStats,
  formatDuration,
  hoursToParts,
} from '@/lib/utils';

export default function DashboardClient({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const [activeTab, setActiveTab] = useState<string>('overall');
  const [isSessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PokerSession | null>(
    null,
  );
  const [isRakebackModalOpen, setRakebackModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allDataDates = [
    ...initialData.sessions.map((s) => s.date),
    ...initialData.rakebacks.map((r) => r.date),
  ];
  const dataMonths = Array.from(
    new Set(
      allDataDates.map((dVal) => {
        const d = new Date(dVal);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }),
    ),
  );

  const allMonths = Array.from(
    new Set([...dataMonths, ...initialData.customMonths]),
  )
    .sort()
    .reverse();

  const handleAddMonth = () => {
    const newMonth = prompt(
      'Enter month (YYYY-MM):',
      new Date().toISOString().slice(0, 7),
    );
    if (newMonth && !allMonths.includes(newMonth)) {
      startTransition(async () => {
        await addMonth(newMonth);
        setActiveTab(newMonth);
      });
    }
  };

  const handleDeleteSession = (id: string) => {
    if (confirm('Delete this session?')) {
      startTransition(async () => {
        await deleteSession(id);
      });
    }
  };

  const handleDeleteRakeback = (id: string) => {
    if (confirm('Delete this rakeback entry?')) {
      startTransition(async () => {
        await deleteRakeback(id);
      });
    }
  };

  const handleDeleteMonth = (month: string) => {
    if (
      confirm(
        `Delete ${month}? This removes the month tab and any sessions or rakeback logged in that month.`,
      )
    ) {
      startTransition(async () => {
        await deleteMonth(month);
        if (activeTab === month) {
          setActiveTab('overall');
        }
      });
    }
  };

  const openNewSessionModal = () => {
    setEditingSession(null);
    setSessionModalOpen(true);
  };

  const openEditSessionModal = (session: PokerSession) => {
    setEditingSession(session);
    setSessionModalOpen(true);
  };

  const closeSessionModal = () => {
    setSessionModalOpen(false);
    setEditingSession(null);
  };

  const toDateInputValue = (date: Date | string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const sessionDurationParts = editingSession
    ? hoursToParts(editingSession.hoursPlayed)
    : { hours: '', minutes: '' };

  // --- DATA FILTERING LOGIC ---
  const filteredSessions =
    activeTab === 'overall'
      ? initialData.sessions
      : initialData.sessions.filter((s) => {
          const d = new Date(s.date);
          return (
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` ===
            activeTab
          );
        });

  const filteredRakebacks =
    activeTab === 'overall'
      ? initialData.rakebacks
      : initialData.rakebacks.filter((r) => {
          const d = new Date(r.date);
          return (
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` ===
            activeTab
          );
        });

  const totalRakeback = filteredRakebacks.reduce((sum, r) => sum + r.amount, 0);
  const stakeStats = calculateStakeStats(filteredSessions, totalRakeback);
  const totalNetProfit = stakeStats.reduce(
    (sum, stat) => sum + stat.netWinnings,
    0,
  );
  const rawSessionProfit = filteredSessions.reduce(
    (sum, s) => sum + (s.endingBalance - s.startingBalance),
    0,
  );
  const totalSessionHours = filteredSessions.reduce(
    (sum, s) => sum + s.hoursPlayed,
    0,
  );

  // Timeline events for graph
  const timelineEvents = [
    ...filteredSessions.map((s) => ({
      date: new Date(s.date),
      profit: s.endingBalance - s.startingBalance,
      type: 'session',
    })),
    ...filteredRakebacks.map((r) => ({
      date: new Date(r.date),
      profit: r.amount,
      type: 'rakeback',
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const chartData = timelineEvents.reduce(
    (acc, ev) => {
      const previousTotal = acc.length > 0 ? acc[acc.length - 1].profit : 0;
      acc.push({
        date: ev.date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: activeTab === 'overall' ? '2-digit' : undefined,
        }),
        profit: previousTotal + ev.profit,
      });
      return acc;
    },
    [] as { date: string; profit: number }[],
  );

  chartData.unshift({ date: 'Start', profit: 0 });

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 font-sans p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <header className='flex justify-between items-center mb-8 border-b border-slate-800 pb-4'>
        <h1 className='text-2xl font-bold tracking-tight text-white flex items-center gap-2'>
          POKER<span className='text-emerald-500'>TRACKER</span>
        </h1>
        <div className='flex gap-3'>
          {activeTab !== 'overall' && (
            <>
              <button
                onClick={openNewSessionModal}
                className='bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-lg shadow-emerald-900/20'
              >
                + Add Session
              </button>
              <button
                onClick={() => setRakebackModalOpen(true)}
                className='bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition border border-slate-700'
              >
                + Add Rakeback
              </button>
            </>
          )}
        </div>
      </header>

      {/* Navigation Layout */}
      <div className='flex flex-wrap items-center justify-between border-b border-slate-800 mb-6 pb-2 gap-2'>
        <button
          onClick={() => setActiveTab('overall')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition border ${
            activeTab === 'overall'
              ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-950'
              : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <Globe
            size={16}
            className={
              activeTab === 'overall' ? 'text-emerald-400' : 'text-slate-500'
            }
          />
          <span>Dashboard</span>
        </button>

        <div className='flex gap-2 overflow-x-auto items-center'>
          <span className='text-xs uppercase text-slate-600 font-bold px-2 tracking-wider'>
            Months:
          </span>
          {allMonths.map((month) => (
            <div
              key={month}
              className={`flex items-center rounded-t-lg ${
                activeTab === month
                  ? 'bg-slate-900 border-b-2 border-emerald-500'
                  : ''
              }`}
            >
              <button
                onClick={() => setActiveTab(month)}
                className={`px-4 py-2 font-medium text-sm transition ${
                  activeTab === month
                    ? 'text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {month}
              </button>
              <button
                onClick={() => handleDeleteMonth(month)}
                disabled={isPending}
                title={`Delete ${month}`}
                className='pr-2 text-slate-600 hover:text-red-400 transition'
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddMonth}
            disabled={isPending}
            className='px-3 py-1.5 font-medium text-xs bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition'
          >
            + Add Month
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Dynamic Graph */}
          <div className='bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 backdrop-blur'>
            <h2 className='text-sm font-semibold uppercase text-slate-400 mb-4 flex items-center justify-between'>
              <span>
                {activeTab === 'overall'
                  ? 'Macro Lifetime Trajectory'
                  : `Monthly Profit (${activeTab})`}
              </span>
              {activeTab === 'overall' && (
                <span className='text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20'>
                  Global View
                </span>
              )}
            </h2>
            <div className='h-72 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id={
                        activeTab === 'overall'
                          ? 'lifetimeGradient'
                          : 'monthlyGradient'
                      }
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop
                        offset='5%'
                        stopColor={
                          activeTab === 'overall' ? '#38bdf8' : '#10b981'
                        }
                        stopOpacity={0.5}
                      />
                      <stop
                        offset='95%'
                        stopColor={
                          activeTab === 'overall' ? '#38bdf8' : '#10b981'
                        }
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey='date'
                    stroke='#64748b'
                    fontSize={12}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke='#64748b'
                    fontSize={12}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                    }}
                    itemStyle={{
                      color: activeTab === 'overall' ? '#38bdf8' : '#10b981',
                    }}
                  />
                  <Area
                    type='monotone'
                    dataKey='profit'
                    stroke={activeTab === 'overall' ? '#38bdf8' : '#10b981'}
                    strokeWidth={activeTab === 'overall' ? 2.5 : 2}
                    fillOpacity={1}
                    fill={`url(#${activeTab === 'overall' ? 'lifetimeGradient' : 'monthlyGradient'})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stake Stats Table */}
          <div className='bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur'>
            <div className='px-6 py-4 border-b border-slate-800 bg-slate-950/50'>
              <h2 className='text-sm font-semibold uppercase text-slate-400'>
                Statistics by Stake
              </h2>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left'>
                <thead className='bg-slate-950 text-slate-400 uppercase font-medium text-xs border-b border-slate-800'>
                  <tr>
                    <th className='px-6 py-4'>Stake</th>
                    <th className='px-6 py-4 text-right'>Net Winnings</th>
                    <th className='px-6 py-4 text-right'>Hours</th>
                    <th className='px-6 py-4 text-right'>$/Hour</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-800/50'>
                  {stakeStats.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className='px-6 py-8 text-center text-slate-500'
                      >
                        No stakes data available.
                      </td>
                    </tr>
                  )}
                  {stakeStats.map((stat) => (
                    <tr
                      key={stat.stake}
                      className='hover:bg-slate-800/20 transition'
                    >
                      <td className='px-6 py-4 font-medium text-slate-200'>
                        {stat.stake}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-medium ${stat.netWinnings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {stat.netWinnings >= 0 ? '+' : ''}$
                        {stat.netWinnings.toFixed(2)}
                      </td>
                      <td className='px-6 py-4 text-right text-slate-300 whitespace-nowrap'>
                        {formatDuration(stat.totalHours)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-medium ${stat.hourlyRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {stat.hourlyRate >= 0 ? '+' : ''}$
                        {stat.hourlyRate.toFixed(2)}/h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Session Log */}
          <div className='bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur'>
            <div className='px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center'>
              <h2 className='text-sm font-semibold uppercase text-slate-400'>
                Session Log
              </h2>
              {activeTab === 'overall' && (
                <span className='text-[10px] text-slate-500 uppercase tracking-widest font-mono'>
                  View Only
                </span>
              )}
            </div>
            <div className='overflow-hidden'>
              <table className='w-full text-sm text-left table-fixed'>
                <thead className='bg-slate-950 text-slate-400 uppercase font-medium text-xs border-b border-slate-800'>
                  <tr className='bg-slate-800/40 text-slate-200'>
                    <td className='px-3 py-3 font-bold'>TOTALS</td>
                    <td className='px-3 py-3'></td>
                    {activeTab !== 'overall' && (
                      <>
                        <td className='px-3 py-3'></td>
                        <td className='px-3 py-3'></td>
                      </>
                    )}
                    <td
                      className={`px-3 py-3 text-right font-bold whitespace-nowrap ${rawSessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {rawSessionProfit >= 0 ? '+' : ''}$
                      {rawSessionProfit.toFixed(2)}
                    </td>
                    <td className='px-3 py-3 text-right font-bold text-slate-200 whitespace-nowrap'>
                      {formatDuration(totalSessionHours)}
                    </td>
                    {activeTab !== 'overall' && <td className='px-3 py-3'></td>}
                  </tr>
                  <tr>
                    <th className='px-3 py-3'>Date</th>
                    <th className='px-3 py-3'>Stake</th>
                    {activeTab !== 'overall' && (
                      <>
                        <th className='px-3 py-3 text-right'>Start</th>
                        <th className='px-3 py-3 text-right'>End</th>
                      </>
                    )}
                    <th className='px-3 py-3 text-right'>Profit</th>
                    <th className='px-3 py-3 text-right'>Hours</th>
                    {activeTab !== 'overall' && (
                      <th className='px-3 py-3 text-center w-16'>Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-800/50'>
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={activeTab === 'overall' ? 4 : 7}
                        className='px-3 py-8 text-center text-slate-500'
                      >
                        No sessions recorded.
                      </td>
                    </tr>
                  )}
                  {filteredSessions.map((session) => {
                    const profit =
                      session.endingBalance - session.startingBalance;
                    return (
                      <tr
                        key={session.id}
                        className='hover:bg-slate-800/20 transition'
                      >
                        <td className='px-3 py-3 text-slate-300 whitespace-nowrap'>
                          {new Date(session.date).toLocaleDateString(
                            undefined,
                            { month: 'short', day: 'numeric', year: 'numeric' },
                          )}
                        </td>
                        <td className='px-3 py-3 font-medium text-slate-200 truncate'>
                          {session.stake}
                        </td>
                        {activeTab !== 'overall' && (
                          <>
                            <td className='px-3 py-3 text-right text-slate-300 whitespace-nowrap'>
                              ${session.startingBalance.toFixed(2)}
                            </td>
                            <td className='px-3 py-3 text-right text-slate-300 whitespace-nowrap'>
                              ${session.endingBalance.toFixed(2)}
                            </td>
                          </>
                        )}
                        <td
                          className={`px-3 py-3 text-right font-medium whitespace-nowrap ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                          {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                        </td>
                        <td className='px-3 py-3 text-right text-slate-300 whitespace-nowrap'>
                          {formatDuration(session.hoursPlayed)}
                        </td>
                        {activeTab !== 'overall' && (
                          <td className='px-3 py-3'>
                            <div className='flex items-center justify-center gap-1'>
                              <button
                                onClick={() => openEditSessionModal(session)}
                                disabled={isPending}
                                title='Edit session'
                                className='p-1 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition disabled:opacity-50'
                              >
                                <Pencil size={13} strokeWidth={1.75} />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(session.id)}
                                disabled={isPending}
                                title='Delete session'
                                className='p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800 transition disabled:opacity-50'
                              >
                                <Trash2 size={13} strokeWidth={1.75} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rakeback Log */}
          <div className='bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur'>
            <div className='px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center'>
              <h2 className='text-sm font-semibold uppercase text-slate-400'>
                Rakeback Log
              </h2>
              {activeTab === 'overall' && (
                <span className='text-[10px] text-slate-500 uppercase tracking-widest font-mono'>
                  View Only
                </span>
              )}
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left'>
                <thead className='bg-slate-950 text-slate-400 uppercase font-medium text-xs border-b border-slate-800'>
                  <tr className='bg-slate-800/40 text-slate-200'>
                    <td className='px-6 py-3 font-bold'>TOTAL</td>
                    <td className='px-6 py-3 text-right font-bold text-emerald-400'>
                      +${totalRakeback.toFixed(2)}
                    </td>
                    {activeTab !== 'overall' && <td className='px-6 py-3'></td>}
                  </tr>
                  <tr>
                    <th className='px-6 py-4'>Date</th>
                    <th className='px-6 py-4 text-right'>Amount</th>
                    {activeTab !== 'overall' && (
                      <th className='px-6 py-4 text-center'>Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-800/50'>
                  {filteredRakebacks.length === 0 && (
                    <tr>
                      <td
                        colSpan={activeTab === 'overall' ? 2 : 3}
                        className='px-6 py-8 text-center text-slate-500'
                      >
                        No rakeback claimed.
                      </td>
                    </tr>
                  )}
                  {filteredRakebacks.map((rakeback) => (
                    <tr
                      key={rakeback.id}
                      className='hover:bg-slate-800/20 transition'
                    >
                      <td className='px-6 py-4 text-slate-300 whitespace-nowrap'>
                        {new Date(rakeback.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className='px-6 py-4 text-right font-medium text-emerald-400'>
                        +${rakeback.amount.toFixed(2)}
                      </td>
                      {activeTab !== 'overall' && (
                        <td className='px-6 py-4'>
                          <div className='flex items-center justify-center'>
                            <button
                              onClick={() => handleDeleteRakeback(rakeback.id)}
                              disabled={isPending}
                              title='Delete rakeback'
                              className='p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800 transition disabled:opacity-50'
                            >
                              <Trash2 size={13} strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Overview Cards */}
        <div className='space-y-4'>
          <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm'>
            <span className='text-xs uppercase font-medium text-slate-500'>
              Total Net Profit
            </span>
            <p
              className={`text-4xl font-bold mt-2 ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {totalNetProfit >= 0 ? '+' : ''}${totalNetProfit.toFixed(2)}
            </p>
          </div>
          <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm'>
            <span className='text-xs uppercase font-medium text-slate-500'>
              Total Rakeback Earned
            </span>
            <p className='text-3xl font-bold text-slate-200 mt-2'>
              ${totalRakeback.toFixed(2)}
            </p>
          </div>
          <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm'>
            <span className='text-xs uppercase font-medium text-slate-500'>
              Sessions Played
            </span>
            <p className='text-3xl font-bold text-slate-200 mt-2'>
              {filteredSessions.length}
            </p>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isSessionModalOpen && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
          <form
            key={editingSession?.id ?? 'new-session'}
            action={async (formData) => {
              if (editingSession) {
                await updateSession(formData);
              } else {
                await addSession(formData);
              }
              closeSessionModal();
            }}
            className='bg-slate-900 p-6 rounded-xl border border-slate-800 w-full max-w-md shadow-2xl'
          >
            {editingSession && (
              <input type='hidden' name='id' value={editingSession.id} />
            )}
            <h2 className='text-xl font-bold mb-4 text-white'>
              {editingSession
                ? 'Edit Session'
                : `Log Session for ${activeTab}`}
            </h2>
            <div className='space-y-4 mb-6 text-sm text-slate-300'>
              <label className='block'>
                Date{' '}
                <input
                  type='date'
                  name='date'
                  required
                  defaultValue={
                    editingSession
                      ? toDateInputValue(editingSession.date)
                      : toDateInputValue(new Date())
                  }
                  className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                />
              </label>
              <label className='block'>
                Stake{' '}
                <input
                  type='text'
                  name='stake'
                  placeholder='e.g. 1/2 NL'
                  required
                  defaultValue={editingSession?.stake ?? ''}
                  className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                />
              </label>
              <label className='block'>
                Starting Balance ($){' '}
                <input
                  type='number'
                  step='0.01'
                  name='startingBalance'
                  required
                  defaultValue={editingSession?.startingBalance ?? ''}
                  className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                />
              </label>
              <label className='block'>
                Ending Balance ($){' '}
                <input
                  type='number'
                  step='0.01'
                  name='endingBalance'
                  required
                  defaultValue={editingSession?.endingBalance ?? ''}
                  className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                />
              </label>
              <div className='grid grid-cols-2 gap-3'>
                <label className='block'>
                  Hours{' '}
                  <input
                    type='number'
                    min='0'
                    step='1'
                    name='hours'
                    defaultValue={sessionDurationParts.hours}
                    className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                  />
                </label>
                <label className='block'>
                  Minutes{' '}
                  <input
                    type='number'
                    min='0'
                    max='59'
                    step='1'
                    name='minutes'
                    defaultValue={sessionDurationParts.minutes}
                    className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                  />
                </label>
              </div>
            </div>
            <div className='flex justify-end gap-3'>
              <button
                type='button'
                onClick={closeSessionModal}
                className='px-4 py-2 text-slate-400 hover:text-white transition'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition shadow-lg shadow-emerald-900/20'
              >
                {editingSession ? 'Update Session' : 'Save Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isRakebackModalOpen && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
          <form
            action={async (formData) => {
              await addRakeback(formData);
              setRakebackModalOpen(false);
            }}
            className='bg-slate-900 p-6 rounded-xl border border-slate-800 w-full max-w-md shadow-2xl'
          >
            <h2 className='text-xl font-bold mb-4 text-white'>
              Add Rakeback for {activeTab}
            </h2>
            <div className='space-y-4 mb-6 text-sm text-slate-300'>
              <label className='block'>
                Date{' '}
                <input
                  type='date'
                  name='date'
                  required
                  defaultValue={toDateInputValue(new Date())}
                  className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                />
              </label>
              <label className='block'>
                Amount ($){' '}
                <input
                  type='number'
                  step='0.01'
                  name='amount'
                  required
                  className='w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none'
                />
              </label>
            </div>
            <div className='flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setRakebackModalOpen(false)}
                className='px-4 py-2 text-slate-400 hover:text-white transition'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition shadow-lg shadow-emerald-900/20'
              >
                Save Rakeback
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
