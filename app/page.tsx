// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Client {
 id: number;
 name: string;
 email: string;
}

export default function Home() {
 const [clients, setClients] = useState<Client[]>([]);
 const [newClientName, setNewClientName] = useState('');
 const [loading, setLoading] = useState(false);

 // Fetch clients from the API on component mount
 useEffect(() => {
  const fetchClients = async () => {
   try {
    const response = await fetch('/api/clients');
    if (response.ok) {
     const data: Client[] = await response.json();
     setClients(data);
    } else {
     console.error('Failed to fetch clients.');
    }
   } catch (error) {
    console.error('Error fetching clients:', error);
   }
  };

  fetchClients();
 }, []);

 // Function to create a new client via the API
 const createClient = async () => {
  if (newClientName.trim() === '') {
   alert('Please enter both client name.');
   return;
  }

  setLoading(true);

  try {
   const response = await fetch('/api/clients', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newClientName.trim() }),
   });

   if (response.ok) {
    const createdClient: Client = await response.json();
    setClients((prevClients) => [...prevClients, createdClient]);
    setNewClientName('');
   } else {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to create client.');
   }
  } catch (error) {
   console.error('Error creating client:', error);
   alert('An error occurred while creating the client.');
  } finally {
   setLoading(false);
  }
 };

 return (
  <main className="min-h-screen bg-gray-100 p-4">
   <h1 className="text-3xl font-bold text-center mb-6">Client Management</h1>
   <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
    {/* Create New Client Section */}
    <div className="mb-4">
     <label className="block text-gray-700">Create New Client:</label>
     <div className="flex mt-2">
      <input
       type="text"
       value={newClientName}
       onChange={(e) => setNewClientName(e.target.value)}
       placeholder="Client Name"
       className="flex-grow border rounded px-2 py-1 mr-2"
      />
      <button
       onClick={createClient}
       disabled={loading}
       className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
       {loading ? 'Creating...' : 'Create'}
      </button>
     </div>
    </div>

    {/* Select Existing Client Section */}
    <div className="mb-4">
     <label className="block text-gray-700">Select Client:</label>
     <div className="flex mt-2">
      <select
       value=""
       onChange={(e) => {
        const selectedId = Number(e.target.value);
        if (!isNaN(selectedId)) {
         // No programmatic routing here; users click the Link
        }
       }}
       className="flex-grow border rounded px-2 py-1 mr-2"
      >
       <option
        value=""
        disabled
       >
        -- Select Client --
       </option>
       {clients.map((client) => (
        <option
         key={client.id}
         value={client.id}
        >
         {client.name}
        </option>
       ))}
      </select>
      {/* Instead of a button, provide a link for each client */}
     </div>
     <ul className="mt-4">
      {clients.map((client) => (
       <li
        key={client.id}
        className="mb-2"
       >
        <Link
         href={`/clients/${client.id}`}
         className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
        >
         {client.name}
        </Link>
       </li>
      ))}
     </ul>
    </div>
   </div>
  </main>
 );
}
