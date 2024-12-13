// app/api/clients/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '../../../prisma/client';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
 try {
  const clients = await prisma.client.findMany({
   include: { transactions: true },
  });
  return NextResponse.json(clients);
 } catch (error) {
  console.error('Error fetching clients:', error);
  return NextResponse.json({ error: 'Failed to fetch clients.' }, { status: 500 });
 }
}
// POST: Create a new client
export async function POST(request: NextRequest) {
 try {
  const { name } = await request.json(); // Removed `email`
  console.log('POST /api/clients', { name });

  if (!name) {
   return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const newClient = await prisma.client.create({
   data: { name },
  });

  console.log('Client created:', newClient);

  return NextResponse.json(newClient, { status: 201 });
 } catch (error: any) {
  console.error('Error creating client:', error);
  return NextResponse.json({ error: 'Failed to create client.', details: error.message }, { status: 500 });
 }
}
