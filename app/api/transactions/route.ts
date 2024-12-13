// app/api/transactions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '../../../prisma/client';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
 const url = new URL(request.url);
 const clientId = url.searchParams.get('clientId');

 if (!clientId) {
  return NextResponse.json({ error: 'clientId is required.' }, { status: 400 });
 }

 try {
  const transactions = await prisma.transaction.findMany({
   where: { clientId: Number(clientId) },
   orderBy: { date: 'asc' },
  });
  console.log(`Fetched transactions for clientId ${clientId}:`, transactions);
  return NextResponse.json(transactions);
 } catch (error) {
  console.error('Error fetching transactions:', error);
  return NextResponse.json({ error: 'Failed to fetch transactions.' }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
  const { clientId, date, description, credit, debit, price, total } = await request.json();
  console.log('POST /api/transactions', { clientId, date, description, credit, debit, price, total });

  if (!clientId || !date) {
   return NextResponse.json({ error: 'clientId and date are required.' }, { status: 400 });
  }

  const newTransaction = await prisma.transaction.create({
   data: {
    clientId: Number(clientId),
    date: new Date(date),
    description: description || '',
    credit: credit || 0,
    debit: debit || 0,
    price: price || 0,
    total: total || 0,
   },
  });

  console.log('Transaction created:', newTransaction);

  return NextResponse.json(newTransaction, { status: 201 });
 } catch (error: any) {
  console.error('Error creating transaction:', error);
  if (error.code === 'P2002') {
   // Unique constraint failed
   return NextResponse.json({ error: 'Unique constraint failed.', details: error.meta }, { status: 400 });
  }
  return NextResponse.json({ error: 'Failed to create transaction.', details: error.message }, { status: 500 });
 }
}
