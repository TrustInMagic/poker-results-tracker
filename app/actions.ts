// app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function parseHoursPlayed(formData: FormData): number {
  const hours = parseFloat(formData.get('hours') as string) || 0;
  const minutes = parseFloat(formData.get('minutes') as string) || 0;
  const clampedMinutes = Math.min(Math.max(minutes, 0), 59);
  return hours + clampedMinutes / 60;
}

function monthDateRange(name: string) {
  const start = new Date(`${name}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export async function addSession(formData: FormData) {
  const date = new Date(formData.get('date') as string);
  const stake = formData.get('stake') as string;
  const startingBalance = parseFloat(formData.get('startingBalance') as string);
  const endingBalance = parseFloat(formData.get('endingBalance') as string);
  const hoursPlayed = parseHoursPlayed(formData);

  await prisma.pokerSession.create({
    data: { date, stake, startingBalance, endingBalance, hoursPlayed },
  });

  revalidatePath('/');
}

export async function updateSession(formData: FormData) {
  const id = formData.get('id') as string;
  const date = new Date(formData.get('date') as string);
  const stake = formData.get('stake') as string;
  const startingBalance = parseFloat(formData.get('startingBalance') as string);
  const endingBalance = parseFloat(formData.get('endingBalance') as string);
  const hoursPlayed = parseHoursPlayed(formData);

  await prisma.pokerSession.update({
    where: { id },
    data: { date, stake, startingBalance, endingBalance, hoursPlayed },
  });

  revalidatePath('/');
}

export async function deleteSession(id: string) {
  await prisma.pokerSession.delete({
    where: { id },
  });
  revalidatePath('/');
}

export async function addRakeback(formData: FormData) {
  const date = new Date(formData.get('date') as string);
  const amount = parseFloat(formData.get('amount') as string);

  await prisma.rakebackEntry.create({
    data: { date, amount },
  });

  revalidatePath('/');
}

export async function deleteRakeback(id: string) {
  await prisma.rakebackEntry.delete({
    where: { id },
  });
  revalidatePath('/');
}

export async function getPokerData() {
  const sessions = await prisma.pokerSession.findMany({
    orderBy: { date: 'asc' },
  });
  const rakebacks = await prisma.rakebackEntry.findMany({
    orderBy: { date: 'asc' },
  });

  return { sessions, rakebacks };
}

export async function addMonth(name: string) {
  const existing = await prisma.month.findUnique({ where: { name } });
  if (!existing) {
    await prisma.month.create({
      data: { name },
    });
  }
  revalidatePath('/');
}

export async function deleteMonth(name: string) {
  const { start, end } = monthDateRange(name);

  await prisma.$transaction([
    prisma.pokerSession.deleteMany({
      where: { date: { gte: start, lt: end } },
    }),
    prisma.rakebackEntry.deleteMany({
      where: { date: { gte: start, lt: end } },
    }),
    prisma.month.deleteMany({ where: { name } }),
  ]);

  revalidatePath('/');
}