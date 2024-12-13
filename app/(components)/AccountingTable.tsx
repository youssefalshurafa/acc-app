'use client';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Transaction {
 id: number;
 date: string; // DD/MM/YYYY format
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

 const getTodayDateFormatted = (): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
 };

 // Helper function to format numbers with thousands separators
 const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return num.toLocaleString(undefined, options);
 };

 // Helper function to remove formatting and parse to number
 const unformatNumber = (formatted: string): number => {
  // Remove all non-digit characters except decimal point and minus sign
  const cleaned = formatted.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
 };

 // Fetch transactions from the API on component mount and when clientId changes
 useEffect(() => {
  const fetchTransactions = async () => {
   setLoading(true);
   try {
    const response = await fetch(`/api/transactions?clientId=${clientId}`);
    if (response.ok) {
     const data: Transaction[] = await response.json();
     // Convert date strings to DD/MM/YYYY format
     const formattedData = data.map((tx) => {
      if (tx.date.includes('T')) {
       // Extract the date part before 'T'
       const [isoDate] = tx.date.split('T'); // "2024-12-13"
       const [year, month, day] = isoDate.split('-');
       return {
        ...tx,
        date: `${day}/${month}/${year}`,
       };
      } else {
       // If the date is already in YYYY-MM-DD format
       const [year, month, day] = tx.date.split('-');
       return {
        ...tx,
        date: `${day}/${month}/${year}`,
       };
      }
     });
     console.log('Fetched transactions:', formattedData);
     setTransactions(formattedData);
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
 const handleChange = (
  id: number,
  field: keyof Omit<Transaction, 'id' | 'total' | 'isEditing'>, // Exclude 'isEditing'
  value: string
 ) => {
  // Unformat the value to get the numerical representation
  const numericValue = unformatNumber(value);

  setTransactions((prev) =>
   prev.map((tx) => {
    if (tx.id === id) {
     const updatedTx: Transaction = { ...tx };

     if (field === 'date') {
      // Basic validation for DD/MM/YYYY format
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (dateRegex.test(value)) {
       updatedTx.date = value;
      } else {
       // Optionally, set an error state or provide user feedback
       console.warn('Invalid date format. Use DD/MM/YYYY.');
       return tx; // Do not update if invalid
      }
     } else if (field === 'description') {
      updatedTx.description = value;
     } else {
      // Prevent negative numbers
      updatedTx[field] = numericValue < 0 ? 0 : numericValue;
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

 // Function to handle deletion of a transaction
 const handleDelete = async (id: number) => {
  // Confirm deletion with the user
  const confirmDelete = window.confirm('Are you sure you want to delete this transaction?');
  if (!confirmDelete) return;

  try {
   // If the transaction is already saved (id > 0), delete from the backend
   if (id > 0) {
    const response = await fetch(`/api/transactions/${id}`, {
     method: 'DELETE',
    });

    if (!response.ok) {
     const errorData = await response.json();
     console.error('Failed to delete transaction:', errorData);
     alert(errorData.error || 'Failed to delete transaction.');
     return;
    }
   }

   // Remove the transaction from the frontend state
   setTransactions((prev) => prev.filter((tx) => tx.id !== id));
   alert('Transaction deleted successfully.');
  } catch (error) {
   console.error('Error deleting transaction:', error);
   alert('An error occurred while deleting the transaction.');
  }
 };

 // Function to add a new transaction row with a temporary negative ID
 const addRow = () => {
  const tempId = -Date.now(); // Ensures a unique negative ID
  const todayDate = getTodayDateFormatted(); // Get today's date in DD/MM/YYYY

  const newTx: Transaction = {
   id: tempId, // Temporary ID
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
   // Identify existing transactions (id > 0)
   const existingTransactions = transactions.filter((tx) => tx.id > 0);

   // Identify new transactions (temporary negative IDs)
   const newTransactions = transactions.filter((tx) => tx.id < 0);

   // Update existing transactions
   for (const tx of existingTransactions) {
    const [day, month, year] = tx.date.split('/');
    const formattedDate = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD

    console.log('Updating existing transaction:', {
     id: tx.id,
     date: formattedDate,
     description: tx.description,
     credit: tx.credit,
     debit: tx.debit,
     price: tx.price,
     total: tx.total,
    });

    const response = await fetch(`/api/transactions/${tx.id}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      date: formattedDate,
      description: tx.description,
      credit: tx.credit,
      debit: tx.debit,
      price: tx.price,
      total: tx.total,
     }),
    });

    if (!response.ok) {
     const errorData = await response.json();
     console.error('Failed to update transaction:', errorData);
     alert(errorData.error || 'Failed to update transaction.');
     // Optionally, you can choose to continue or abort the saving process
     // For example, to abort:
     // throw new Error('Failed to update transaction');
    } else {
     console.log(`Transaction ${tx.id} updated successfully.`);
    }
   }

   // Create new transactions
   for (const tx of newTransactions) {
    const [day, month, year] = tx.date.split('/');
    const formattedDate = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD

    console.log('Creating new transaction:', {
     clientId,
     date: formattedDate,
     description: tx.description,
     credit: tx.credit,
     debit: tx.debit,
     price: tx.price,
     total: tx.total,
    });

    const response = await fetch('/api/transactions', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      clientId,
      date: formattedDate,
      description: tx.description,
      credit: tx.credit,
      debit: tx.debit,
      price: tx.price,
      total: tx.total,
     }),
    });

    if (!response.ok) {
     const errorData = await response.json();
     console.error('Failed to create transaction:', errorData);
     alert(errorData.error || 'Failed to create transaction.');
     // Optionally, handle the error as needed
    } else {
     const createdTx: Transaction = await response.json();

     // Convert the created transaction's date back to DD/MM/YYYY
     if (createdTx.date.includes('T')) {
      // Extract the date part before 'T'
      const [isoDate] = createdTx.date.split('T'); // "2024-12-13"
      const [createdYear, createdMonth, createdDay] = isoDate.split('-');
      createdTx.date = `${createdDay}/${createdMonth}/${createdYear}`;
     } else {
      // If the date is already in YYYY-MM-DD format
      const [createdYear, createdMonth, createdDay] = createdTx.date.split('-');
      createdTx.date = `${createdDay}/${createdMonth}/${createdYear}`;
     }

     console.log('New transaction created:', createdTx);

     // Replace the temporary transaction with the one from the database
     setTransactions((prev) => prev.map((prevTx) => (prevTx.id === tx.id ? createdTx : prevTx)));
    }
   }

   alert('Transactions saved successfully.');

   // Refetch transactions after saving to ensure all data is up-to-date
   const fetchResponse = await fetch(`/api/transactions?clientId=${clientId}`);
   if (fetchResponse.ok) {
    const data: Transaction[] = await fetchResponse.json();
    // Convert date strings to DD/MM/YYYY format
    const formattedData = data.map((tx) => {
     if (tx.date.includes('T')) {
      // Extract the date part before 'T'
      const [isoDate] = tx.date.split('T'); // "2024-12-13"
      const [year, month, day] = isoDate.split('-');
      return {
       ...tx,
       date: `${day}/${month}/${year}`,
      };
     } else {
      // If the date is already in YYYY-MM-DD format
      const [year, month, day] = tx.date.split('-');
      return {
       ...tx,
       date: `${day}/${month}/${year}`,
      };
     }
    });
    setTransactions(formattedData);
    console.log('Refetched transactions:', formattedData);
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
       {['Date', 'Description', 'Credit', 'Debit', 'Price', 'Total', 'Cumulative Total', 'Actions'].map((heading) => (
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
          className={`w-full bg-transparent text-sm text-center border ${
           /^(\d{2})\/(\d{2})\/(\d{4})$/.test(tx.date) ? 'border-gray-300' : 'border-red-500'
          } rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500`}
          placeholder="DD/MM/YYYY"
         />
         {!/^(\d{2})\/(\d{2})\/(\d{4})$/.test(tx.date) && tx.date !== '' && <span className="text-red-500 text-xs">Invalid date format</span>}
        </td>

        {/* Description Column */}
        <td className="border border-gray-300 px-4 py-1">
         <input
          type="text"
          value={tx.description}
          onChange={(e) => handleChange(tx.id, 'description', e.target.value)}
          className={`w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500`}
          placeholder="Description"
         />
        </td>

        {/* Credit Column - Always Red */}
        <td className="border border-gray-300 px-4 py-1 text-red-500">
         <input
          type="text"
          value={formatNumber(tx.credit)}
          onFocus={(e) => {
           e.target.value = unformatNumber(e.target.value).toString();
          }}
          onBlur={(e) => {
           e.target.value = formatNumber(unformatNumber(e.target.value));
          }}
          onChange={(e) => handleChange(tx.id, 'credit', e.target.value)}
          className="w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Credit"
         />
        </td>

        {/* Debit Column - Always Green */}
        <td className="border border-gray-300 px-4 py-1 text-green-500">
         <input
          type="text"
          value={formatNumber(tx.debit)}
          onFocus={(e) => {
           e.target.value = unformatNumber(e.target.value).toString();
          }}
          onBlur={(e) => {
           e.target.value = formatNumber(unformatNumber(e.target.value));
          }}
          onChange={(e) => handleChange(tx.id, 'debit', e.target.value)}
          className="w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Debit"
         />
        </td>

        {/* Price Column */}
        <td className="border border-gray-300 px-4 py-1">
         <input
          type="text"
          value={formatNumber(tx.price)}
          onFocus={(e) => {
           e.target.value = unformatNumber(e.target.value).toString();
          }}
          onBlur={(e) => {
           e.target.value = formatNumber(unformatNumber(e.target.value));
          }}
          onChange={(e) => handleChange(tx.id, 'price', e.target.value)}
          className="w-full bg-transparent text-sm text-center border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Price"
         />
        </td>

        {/* Total Column - Conditional Styling */}
        <td className={`border border-gray-300 px-4 py-1 text-right ${tx.total < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatNumber(tx.total)}</td>

        {/* Cumulative Total Column - Conditional Styling */}
        <td className={`border border-gray-300 px-4 py-1 text-right ${cumulativeTotals[idx] < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatNumber(cumulativeTotals[idx])}</td>

        {/* Actions Column */}
        <td className="border border-gray-300 px-4 py-1 text-center">
         <button
          onClick={() => handleDelete(tx.id)}
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
         >
          <MdDelete />
         </button>
        </td>
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
       {/* Cumulative Grand Total Column */}
       <td className={`border border-gray-300 px-4 py-2 font-semibold text-right bg-gray-100 ${grandTotal < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatNumber(grandTotal)}</td>
       {/* Actions Column in Footer (Empty) */}
       <td className="border border-gray-300 px-4 py-2 bg-gray-100"></td>
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
