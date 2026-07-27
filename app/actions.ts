// app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addSession(formData: FormData) {
  const date = new Date(formData.get('date') as string);
  const stake = formData.get('stake') as string;
  const startingBalance = parseFloat(formData.get('startingBalance') as string);
  const endingBalance = parseFloat(formData.get('endingBalance') as string);
  const hoursPlayed = parseFloat(formData.get('hoursPlayed') as string);

  await prisma.pokerSession.create({
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
