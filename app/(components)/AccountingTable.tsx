'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Transaction {
 id: number;
 date: string;
 description: string;
 credit: number;
 debit: number;
 price: number;
 total: number;
}

interface AccountingTableProps {
 clientId: number;
 clientName: string;
}

export default function AccountingTable({ clientId, clientName }: AccountingTableProps) {
 const [transactions, setTransactions] = useState<Transaction[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);

 const router = useRouter();

 // Helper function to format numbers
 const formatNumber = (num: number): string => {
  return num.toLocaleString(undefined, {
   minimumFractionDigits: 2,
   maximumFractionDigits: 2,
  });
 };

 // Fetch transactions from the API on component mount and when clientId changes
 useEffect(() => {
  const fetchTransactions = async () => {
   setLoading(true);
   try {
    const response = await fetch(`/api/transactions?clientId=${clientId}`);
    if (response.ok) {
     const data: Transaction[] = await response.json();
     console.log('Fetched transactions:', data);
     setTransactions(data);
    } else {
     const errorData = await response.json();
     console.error('Failed to fetch transactions:', errorData);
     setError(errorData.error || 'Failed to fetch transactions.');
    }
   } catch (error) {
    console.error('Error fetching transactions:', error);
    setError('An error occurred while fetching transactions.');
   } finally {
    setLoading(false);
   }
  };

  fetchTransactions();
 }, [clientId]);

 // Function to handle input changes
 const handleChange = (id: number, field: keyof Omit<Transaction, 'id' | 'total'>, value: string) => {
  setTransactions((prev) =>
   prev.map((tx) => {
    if (tx.id === id) {
     const updatedTx = { ...tx };

     if (field === 'date') {
      // Basic validation for DD/MM/YYYY format
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (dateRegex.test(value)) {
       updatedTx.date = value;
      } else {
       // Optionally, you can set an error state or provide user feedback
       console.warn('Invalid date format. Use DD/MM/YYYY.');
       return tx; // Do not update if invalid
      }
     } else if (field === 'description') {
      updatedTx.description = value;
     } else {
      let numericValue = parseFloat(value) || 0;
      // Prevent negative numbers
      numericValue = numericValue < 0 ? 0 : numericValue;
      updatedTx[field] = numericValue;
     }

     // Recalculate total as (Debit - Credit) * Price
     const { debit, credit, price } = updatedTx;
     updatedTx.total = (debit - credit) * price;

     console.log(`Transaction ${id} updated:`, updatedTx);

     return updatedTx;
    }
    return tx;
   })
  );
 };

 // Function to add a new transaction row with a temporary negative ID

 const addRow = () => {
  const tempId = -Date.now(); // Ensures a unique negative ID
  const todayDate = getTodayDate(); // Get today's date in DD/MM/YYYY

  const newTx: Transaction = {
   id: tempId,
   date: todayDate, // Set date to today's date in DD/MM/YYYY
   description: '',
   credit: 0,
   debit: 0,
   price: 0,
   total: 0,
  };
  console.log('Adding new transaction:', newTx);
  setTransactions((prev) => [...prev, newTx]);
 };

 // Function to save transactions to the API
 const saveTransactions = async () => {
  setSaving(true);
  try {
   // Identify new transactions (temporary negative IDs)
   const newTransactions = transactions.filter((tx) => tx.id < 0);

   console.log('Saving new transactions:', newTransactions);

   for (const tx of newTransactions) {
    if (tx.date) {
     console.log('Sending transaction:', {
      clientId,
      date: tx.date,
      description: tx.description,
      credit: tx.credit,
      debit: tx.debit,
      price: tx.price,
      total: tx.total,
     });

     const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
      },
      body: JSON.stringify({
       clientId,
       date: tx.date,
       description: tx.description,
       credit: tx.credit,
       debit: tx.debit,
       price: tx.price,
       total: tx.total,
      }),
     });

     if (response.ok) {
      const createdTx: Transaction = await response.json();
      console.log('Transaction saved:', createdTx);
      // Replace the temporary transaction with the one from the database
      setTransactions((prev) => prev.map((prevTx) => (prevTx.id === tx.id ? createdTx : prevTx)));
     } else {
      const errorData = await response.json();
      console.error('Failed to save transaction:', errorData);
      alert(errorData.error || 'Failed to save transaction.');
     }
    } else {
     console.warn('Transaction missing required fields:', tx);
    }
   }

   alert('Transactions saved successfully.');

   // Refetch transactions after saving
   const fetchResponse = await fetch(`/api/transactions?clientId=${clientId}`);
   if (fetchResponse.ok) {
    const data: Transaction[] = await fetchResponse.json();
    setTransactions(data);
    console.log('Refetched transactions:', data);
   } else {
    const errorData = await fetchResponse.json();
    console.error('Failed to refetch transactions:', errorData);
    setError(errorData.error || 'Failed to refetch transactions.');
   }
  } catch (error) {
   console.error('Error saving transactions:', error);
   alert('An error occurred while saving transactions.');
  } finally {
   setSaving(false);
  }
 };
 // Helper function to get today's date
 const getTodayDate = (): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
 };

 // Compute cumulative totals
 const cumulativeTotals = transactions.reduce((acc, tx, index) => {
  const previousTotal = index === 0 ? 0 : acc[index - 1];
  acc.push(previousTotal + tx.total);
  return acc;
 }, [] as number[]);

 const grandTotal = transactions.reduce((acc, tx) => acc + tx.total, 0);

 if (loading) {
  return <div>Loading transactions...</div>;
 }

 if (error) {
  return <div className="text-red-500">Error: {error}</div>;
 }

 return (
  <div className="container mx-auto p-4">
   <button
    onClick={() => router.push('/')}
    className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
   >
    Go Back Home
   </button>
   <h1 className="text-3xl font-bold text-center mb-6">Accounting for {clientName}</h1>
   <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-300 table-auto">
     <thead className="bg-gray-100">
      <tr>
       {['Date', 'Description', 'Credit', 'Debit', 'Price', 'Total', 'Cumulative Total'].map((heading) => (
        <th
         key={heading}
         className="border border-gray-300 px-4 py-2 text-center font-medium text-sm"
        >
         {heading}
        </th>
       ))}
      </tr>
     </thead>
     <tbody>
      {transactions.map((tx, idx) => (
       <tr
        key={tx.id}
        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-100 transition`}
       >
        {/* Date Column */}
        <td className="border border-gray-300 px-4 py-1">
         <input
          type="text"
          value={tx.date}
          onChange={(e) => handleChange(tx.id, 'date', e.target.value)}
          className="w-full bg-transparent text-sm text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="DD/MM/YYYY"
         />
        </td>

        {/* Description Column */}
        <td className="border border-gray-300 px-4 py-1">
         <input
          type="text"
          value={tx.description}
          onChange={(e) => handleChange(tx.id, 'description', e.target.value)}
          className="w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Description"
         />
        </td>

        {/* Credit Column - Always Red */}
        <td className="border border-gray-300 px-4 py-1 text-red-500">
         <input
          type="number"
          value={tx.credit}
          onChange={(e) => handleChange(tx.id, 'credit', e.target.value)}
          className="w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          min="0"
          step="0.01"
         />
        </td>

        {/* Debit Column - Always Green */}
        <td className="border border-gray-300 px-4 py-1 text-green-500">
         <input
          type="number"
          value={tx.debit}
          onChange={(e) => handleChange(tx.id, 'debit', e.target.value)}
          className="w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          min="0"
          step="0.01"
         />
        </td>

        {/* Price Column */}
        <td className="border border-gray-300 px-4 py-1">
         <input
          type="number"
          value={tx.price}
          onChange={(e) => handleChange(tx.id, 'price', e.target.value)}
          className="w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          min="0"
          step="0.01"
         />
        </td>

        {/* Total Column - Conditional Styling */}
        <td className={`border border-gray-300 px-4 py-1 text-right ${tx.total < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatNumber(tx.total)}</td>

        {/* Cumulative Total Column - Conditional Styling */}
        <td className={`border border-gray-300 px-4 py-1 text-right ${cumulativeTotals[idx] < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatNumber(cumulativeTotals[idx])}</td>
       </tr>
      ))}
     </tbody>
     <tfoot>
      <tr>
       <td
        colSpan={5}
        className="border border-gray-300 px-4 py-2 font-semibold text-right bg-gray-100"
       >
        Grand Total:
       </td>
       {/* Total Grand Total Column */}
       <td className={`border border-gray-300 px-4 py-2 font-semibold text-right bg-gray-100 ${grandTotal < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatNumber(grandTotal)}</td>
      </tr>
     </tfoot>
    </table>
   </div>
   <div className="mt-4">
    <button
     onClick={addRow}
     className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition mr-4"
    >
     Add Row
    </button>
    <button
     onClick={saveTransactions}
     disabled={saving}
     className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
     {saving ? 'Saving...' : 'Save Transactions'}
    </button>
   </div>
  </div>
 );
}
