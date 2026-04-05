// Mock API for transactions - works without Supabase
// In-memory database with persistence to localStorage simulation

// Generate rich mock data (same as frontend)
function generateMockTransactions() {
  const now = new Date();
  const entries = [];
  const cats = [
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
    
    // Add income transactions (salary and freelance)
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

// Helper to filter transactions based on query parameters
function filterTransactions(transactions, query) {
  let filtered = [...transactions];
  
  // Filter by type
  if (query.type && query.type !== 'all') {
    filtered = filtered.filter(t => t.type === query.type);
  }
  
  // Filter by category
  if (query.category) {
    filtered = filtered.filter(t => t.category === query.category);
  }
  
  // Filter by search term
  if (query.search) {
    const term = query.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term)
    );
  }
  
  // Filter by date range
  if (query.dateFrom) {
    const fromDate = new Date(query.dateFrom);
    filtered = filtered.filter(t => new Date(t.date) >= fromDate);
  }
  
  if (query.dateTo) {
    const toDate = new Date(query.dateTo);
    filtered = filtered.filter(t => new Date(t.date) <= toDate);
  }
  
  // Filter by amount range
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
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      default:
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  } else {
    // Default sort: date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  return filtered;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  try {
    // GET - Retrieve transactions with optional filtering
    if (req.method === 'GET') {
      const query = req.query;
      const filtered = filterTransactions(transactionsDB, query);
      return res.status(200).json(filtered);
    }
    
    // POST - Create a new transaction
    if (req.method === 'POST') {
      const { date, amount, category, type, description } = req.body;
      
      if (!date || !amount || !category || !type || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newTransaction = {
        id: nextId++,
        date,
        amount: parseFloat(amount),
        category,
        type,
        description
      };
      
      transactionsDB.push(newTransaction);
      return res.status(201).json(newTransaction);
    }
    
    // PUT - Update an existing transaction
    if (req.method === 'PUT') {
      const { id, date, amount, category, type, description } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }
      
      const index = transactionsDB.findIndex(t => t.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Transaction not found' });
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
      return res.status(200).json(updatedTransaction);
    }
    
    // DELETE - Remove a transaction
    if (req.method === 'DELETE') {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }
      
      const index = transactionsDB.findIndex(t => t.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      transactionsDB.splice(index, 1);
      return res.status(200).json({ ok: true, message: 'Transaction deleted' });
    }
    
    // Method not allowed
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (err) {
    console.error('Mock API error:', err);
    res.status(500).json({ error: err.message });
  }
}
