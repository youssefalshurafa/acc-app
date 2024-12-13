// app/api/transactions/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '../../../../prisma/client';
import type { NextRequest } from 'next/server';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
 const { id } = params;

 if (!id) {
  return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
 }

 try {
  const transaction = await prisma.transaction.findUnique({
   where: { id: Number(id) },
  });

  if (!transaction) {
   return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
  }

  await prisma.transaction.delete({
   where: { id: Number(id) },
  });

  return NextResponse.json({ message: 'Transaction deleted successfully.' }, { status: 200 });
 } catch (error: any) {
  console.error('Error deleting transaction:', error);
  return NextResponse.json({ error: 'Failed to delete transaction.', details: error.message }, { status: 500 });
 }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
 const { id } = params;

 if (!id) {
  return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
 }

 try {
  const { date, description, credit, debit, price, total } = await request.json();

  // Validate required fields
  if (!date) {
   return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
  }

  // Check if transaction exists
  const existingTransaction = await prisma.transaction.findUnique({
   where: { id: Number(id) },
  });

  if (!existingTransaction) {
   return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
  }

  // Update the transaction
  const updatedTransaction = await prisma.transaction.update({
   where: { id: Number(id) },
   data: {
    date: new Date(date),
    description: description || existingTransaction.description,
    credit: credit !== undefined ? credit : existingTransaction.credit,
    debit: debit !== undefined ? debit : existingTransaction.debit,
    price: price !== undefined ? price : existingTransaction.price,
    total: total !== undefined ? total : existingTransaction.total,
   },
  });

  return NextResponse.json(updatedTransaction, { status: 200 });
 } catch (error: any) {
  console.error('Error updating transaction:', error);
  return NextResponse.json({ error: 'Failed to update transaction.', details: error.message }, { status: 500 });
 }
}
