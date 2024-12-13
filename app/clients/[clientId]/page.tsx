// app/clients/[clientId]/page.tsx

'use client';

import AccountingTable from '@/app/(components)/AccountingTable';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Client {
 id: number;
 name: string;
 email: string;
}

export default function ClientPage() {
 const router = useRouter();
 const params = useParams();
 const clientId = params?.clientId;

 const [clientName, setClientName] = useState('');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (clientId) {
   const fetchClient = async () => {
    try {
     const response = await fetch(`/api/clients`);
     if (response.ok) {
      const clients: Client[] = await response.json();
      const client = clients.find((c) => c.id === Number(clientId));
      if (client) {
       setClientName(client.name);
      } else {
       // Avoid updating state during render by delaying this action
       setTimeout(() => {
        alert('Client not found.');
        router.push('/');
       }, 0);
      }
     } else {
      console.error('Failed to fetch clients.');
     }
    } catch (error) {
     console.error('Error fetching client:', error);
    } finally {
     setLoading(false);
    }
   };

   fetchClient();
  }
 }, [clientId, router]);

 if (loading) {
  return <div>Loading...</div>;
 }

 if (!clientId) {
  return <div>Invalid client ID.</div>;
 }

 return (
  <main className="min-h-screen bg-gray-100 p-4">
   <h1 className="text-3xl font-bold text-center mb-6">Client: {clientName}</h1>
   <AccountingTable
    clientId={Number(clientId)}
    clientName={clientName}
   />
  </main>
 );
}
