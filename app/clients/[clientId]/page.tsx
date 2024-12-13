// app/clients/[clientId]/page.tsx

'use client';

import AccountingTable from '@/app/(components)/AccountingTable';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Client {
 id: number;
 name: string;
}

export default function ClientPage() {
 const router = useRouter();
 const params = useParams();
 const clientId = params?.clientId;

 const [clientName, setClientName] = useState('');

 useEffect(() => {
  if (clientId) {
   const storedClients = localStorage.getItem('clients');
   if (storedClients) {
    const clients: Client[] = JSON.parse(storedClients);
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
   }
  }
 }, [clientId, router]);

 if (!clientId) {
  return <div>Loading...</div>;
 }

 return (
  <main className="min-h-screen bg-gray-100 p-4">
   <AccountingTable
    clientId={Number(clientId)}
    clientName={clientName}
   />
  </main>
 );
}
