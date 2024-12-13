'use client';

import { useState, useEffect } from 'react';

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

const AccountingTable: React.FC<AccountingTableProps> = ({ clientId }) => {
 const [transactions, setTransactions] = useState<Transaction[]>([]);

 // Load transactions from localStorage for the specific client
 useEffect(() => {
  const storedTransactions = localStorage.getItem(`transactions_${clientId}`);
  if (storedTransactions) {
   setTransactions(JSON.parse(storedTransactions));
  } else {
   // Initialize with one empty transaction
   setTransactions([
    {
     id: 1,
     date: '',
     description: '',
     credit: 0,
     debit: 0,
     price: 0,
     total: 0,
    },
   ]);
  }
 }, [clientId]);

 // Save transactions to localStorage whenever they change
 useEffect(() => {
  localStorage.setItem(`transactions_${clientId}`, JSON.stringify(transactions));
 }, [transactions, clientId]);

 // Rest of the component remains the same...
 // [Include the rest of the component code from the previous AccountingTable component]

 const handleChange = (id: number, field: keyof Omit<Transaction, 'id' | 'total'>, value: string) => {
  setTransactions((prev) =>
   prev.map((tx) => {
    if (tx.id === id) {
     const updatedTx = { ...tx };

     if (field === 'date' || field === 'description') {
      (updatedTx as any)[field] = value;
     } else {
      let numericValue = parseFloat(value) || 0;
      // Prevent negative numbers
      numericValue = numericValue < 0 ? 0 : numericValue;
      (updatedTx as any)[field] = numericValue;
     }

     // Recalculate total as (Debit - Credit) * Price
     const { debit, credit, price } = updatedTx;
     updatedTx.total = (debit - credit) * price;

     return updatedTx;
    }
    return tx;
   })
  );
 };

 const addRow = () => {
  setTransactions((prev) => [
   ...prev,
   {
    id: prev.length + 1,
    date: '',
    description: '',
    credit: 0,
    debit: 0,
    price: 0,
    total: 0,
   },
  ]);
 };

 const grandTotal = transactions.reduce((acc, tx) => acc + tx.total, 0);

 return (
  <div className="container mx-auto p-4">
   <h1 className="text-3xl font-bold text-center mb-6">Accounting Forms</h1>
   <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-200">
     <thead>
      <tr>
       <th className="py-2 px-4 border-b">Date</th>
       <th className="py-2 px-4 border-b">Description</th>
       <th className="py-2 px-4 border-b">Credit</th>
       <th className="py-2 px-4 border-b">Debit</th>
       <th className="py-2 px-4 border-b">Price</th>
       <th className="py-2 px-4 border-b">Totalss</th>
      </tr>
     </thead>
     <tbody>
      {transactions.map((tx) => (
       <tr
        key={tx.id}
        className="hover:bg-gray-100"
       >
        <td className="py-2 px-4 border-b">
         <input
          type="date"
          value={tx.date}
          onChange={(e) => handleChange(tx.id, 'date', e.target.value)}
          className="w-full border rounded px-2 py-1"
         />
        </td>
        <td className="py-2 px-4 border-b">
         <input
          type="text"
          value={tx.description}
          onChange={(e) => handleChange(tx.id, 'description', e.target.value)}
          className="w-full border rounded px-2 py-1"
          placeholder="Description"
         />
        </td>
        <td className="py-2 px-4 border-b">
         <input
          type="number"
          value={tx.credit}
          onChange={(e) => handleChange(tx.id, 'credit', e.target.value)}
          className="w-full border rounded px-2 py-1"
          min="0"
          step="0.01"
         />
        </td>
        <td className="py-2 px-4 border-b">
         <input
          type="number"
          value={tx.debit}
          onChange={(e) => handleChange(tx.id, 'debit', e.target.value)}
          className="w-full border rounded px-2 py-1"
          min="0"
          step="0.01"
         />
        </td>
        <td className="py-2 px-4 border-b">
         <input
          type="number"
          value={tx.price}
          onChange={(e) => handleChange(tx.id, 'price', e.target.value)}
          className="w-full border rounded px-2 py-1"
          min="0"
          step="0.01"
         />
        </td>
        <td className="py-2 px-4 border-b text-right">{tx.total.toFixed(2)}</td>
       </tr>
      ))}
     </tbody>
     <tfoot>
      <tr>
       <td
        colSpan={5}
        className="py-2 px-4 border-t font-semibold text-right"
       >
        Grand Total:
       </td>
       <td className="py-2 px-4 border-t font-semibold text-right">{grandTotal.toFixed(2)}</td>
      </tr>
     </tfoot>
    </table>
   </div>
   <button
    onClick={addRow}
    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
   >
    Add Row
   </button>
  </div>
 );
};

export default AccountingTable;
