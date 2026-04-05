// Mock API service for development
// Intercepts fetch requests to /api/* and returns mock data

import type { Transaction } from '../types';

// Generate mock data (same as in FinanceContext)
function generateMockTransactions(): Transaction[] {
  const now = new Date();
  const entries: Transaction[] = [];
  const cats: Array<{cat: string, type: 'income' | 'expense', desc: string, lo: number, hi: number}> = [
    { cat: 'Food', type: 'expense', desc: 'Groceries & Dining', lo: 300, hi: 2200 },
    { cat: 'Transport', type: 'expense', desc: 'Cab / Metro', lo: 150, hi: 800 },
    { cat: 'Entertainment', type: 'expense', desc: 'Movies / OTT', lo: 200, hi: 1500 },
    { cat: 'Utilities', type: 'expense', desc: 'Electricity / Internet', lo: 500, hi: 3000 },
    { cat: 'Shopping', type: 'expense', desc: 'Clothes / Electronics', lo: 800, hi: 6000 },
    { cat: 'Healthcare', type: 'expense', desc: 'Doctor / Pharmacy', lo: 400, hi: 3500 },
    { cat: 'Rent', type: 'expense', desc: 'Monthly Rent', lo: 12000, hi: 18000 },
    { cat: 'Travel', type: 'expense', desc: 'Trip / Hotel', lo: 3000, hi: 12000 },
    { cat: 'Others', type: 'expense', desc: 'Miscellaneous', lo: 100, hi: 1000 },
    { cat: 'Salary', type: 'income', desc: 'Monthly Salary', lo: 55000, hi: 75000 },
    { cat: 'Freelance', type: 'income', desc: 'Freelance Project', lo: 8000, hi: 25000 },
  ];
  
  let id = 1;
  for (let m = 5; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() - m + 1, 0).getDate();
    
    // Add income transactions
    [cats[9], cats[10]].forEach(c => {
      const day = Math.floor(Math.random() * 5) + 1;
      entries.push({
        id: id++,
        date: new Date(base.getFullYear(), base.getMonth(), day).toISOString(),
        amount: Math.round(c.lo + Math.random() * (c.hi - c.lo)),
        category: c.cat,
        type: c.type,
        description: c.desc
      });
    });
    
    // Add expense transactions
    for (let i = 0; i < 10; i++) {
      const c = cats[Math.floor(Math.random() * 9)];
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const d = new Date(base.getFullYear(), base.getMonth(), day);
      if (d > now) continue;
      entries.push({
        id: id++,
        date: d.toISOString(),
        amount: Math.round(c.lo + Math.random() * (c.hi - c.lo)),
        category: c.cat,
        type: c.type,
        description: c.desc
      });
    }
  }
  
  return entries;
}

// In-memory database
let transactionsDB = generateMockTransactions();
let nextId = Math.max(...transactionsDB.map(t => t.id)) + 1;

// Helper to filter transactions
function filterTransactions(query: Record<string, string>): Transaction[] {
  let filtered = [...transactionsDB];
  
  if (query.type && query.type !== 'all') {
    filtered = filtered.filter(t => t.type === query.type);
  }
  
  if (query.category) {
    filtered = filtered.filter(t => t.category === query.category);
  }
  
  if (query.search) {
    const term = query.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term)
    );
  }
  
  if (query.dateFrom) {
    const fromDate = new Date(query.dateFrom);
    filtered = filtered.filter(t => new Date(t.date) >= fromDate);
  }
  
  if (query.dateTo) {
    const toDate = new Date(query.dateTo);
    filtered = filtered.filter(t => new Date(t.date) <= toDate);
  }
  
  if (query.amountMin) {
    const min = parseFloat(query.amountMin);
    filtered = filtered.filter(t => t.amount >= min);
  }
  
  if (query.amountMax) {
    const max = parseFloat(query.amountMax);
    filtered = filtered.filter(t => t.amount <= max);
  }
  
  // Sort
  if (query.sortBy) {
    switch (query.sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
    }
  }
  
  return filtered;
}

// Mock fetch interceptor
export function setupMockApi() {
  if (typeof window === 'undefined') return;
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only intercept /api/transactions requests
    if (url.includes('/api/transactions')) {
      const method = init?.method || 'GET';
      
      // Parse query parameters from URL
      const urlObj = new URL(url, window.location.origin);
      const queryParams: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Handle different HTTP methods
      switch (method) {
        case 'GET': {
          const filtered = filterTransactions(queryParams);
          return new Response(JSON.stringify(filtered), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        case 'POST': {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const { date, amount, category, type, description } = body;
          
          if (!date || !amount || !category || !type || !description) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const newTransaction: Transaction = {
            id: nextId++,
            date,
            amount: parseFloat(amount),
            category,
            type,
            description
          };
          
          transactionsDB.push(newTransaction);
          return new Response(JSON.stringify(newTransaction), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        case 'PUT': {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const { id, date, amount, category, type, description } = body;
          
          if (!id) {
            return new Response(JSON.stringify({ error: 'Transaction ID is required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const index = transactionsDB.findIndex(t => t.id === parseInt(id));
          
          if (index === -1) {
            return new Response(JSON.stringify({ error: 'Transaction not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const updatedTransaction = {
            ...transactionsDB[index],
            date: date || transactionsDB[index].date,
            amount: amount !== undefined ? parseFloat(amount) : transactionsDB[index].amount,
            category: category || transactionsDB[index].category,
            type: type || transactionsDB[index].type,
            description: description || transactionsDB[index].description
          };
          
          transactionsDB[index] = updatedTransaction;
          return new Response(JSON.stringify(updatedTransaction), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        case 'DELETE': {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const { id } = body;
          
          if (!id) {
            return new Response(JSON.stringify({ error: 'Transaction ID is required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const index = transactionsDB.findIndex(t => t.id === parseInt(id));
          
          if (index === -1) {
            return new Response(JSON.stringify({ error: 'Transaction not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          transactionsDB.splice(index, 1);
          return new Response(JSON.stringify({ ok: true, message: 'Transaction deleted' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        default:
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    // Pass through non-API requests to original fetch
    return originalFetch.call(window, input, init);
  };
  
  console.log('Mock API enabled - intercepting /api/transactions requests');
}

// Toggle for development/production
export const isMockApiEnabled = import.meta.env.DEV; // Enable in development only