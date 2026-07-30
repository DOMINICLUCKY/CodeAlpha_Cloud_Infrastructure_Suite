const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ==========================================
// ROOT ROUTE (Fixes "Cannot GET /" on Vercel)
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
  // Note: If your homepage is named task1.html, change 'index.html' above to 'task1.html'
});

// ==========================================
// MODULE 1: Data Redundancy Removal System
// ==========================================
const database = [];
const hashStore = new Set();

function generateDataHash(data) {
  const normalized = JSON.stringify(data, Object.keys(data).sort()).toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

app.get('/api/task1/data', (req, res) => {
  res.json({ success: true, count: database.length, data: database });
});

app.post('/api/task1/insert', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const payload = { title, content };
  const hash = generateDataHash(payload);

  if (hashStore.has(hash)) {
    return res.status(409).json({ 
      success: false, 
      message: "Redundant record detected. Entry rejected by deduplication engine." 
    });
  }

  const record = { 
    id: `REC-${Date.now()}`, 
    ...payload, 
    hash, 
    createdAt: new Date().toISOString() 
  };
  
  hashStore.add(hash);
  database.push(record);

  res.status(201).json({ 
    success: true, 
    message: "Data verified unique and appended to system.", 
    data: record 
  });
});

// ==========================================
// MODULE 2: SQL Injection Defense & Encryption
// ==========================================
const AES_SECRET = crypto.randomBytes(32);
const IV = crypto.randomBytes(16);
const secureUsers = [];

function encryptAES(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_SECRET, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

app.post('/api/task2/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  const encryptedPassword = encryptAES(password);
  secureUsers.push({ username, passwordHash: encryptedPassword });

  res.json({ 
    success: true, 
    message: "Credentials secured with AES-256 encryption.", 
    encryptedPassword 
  });
});

app.post('/api/task2/login', (req, res) => {
  const { query } = req.body;

  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|OR|AND)\b)|('--'|';'|'=")/i;
  
  if (sqlInjectionPattern.test(query)) {
    return res.status(403).json({ 
      success: false, 
      status: "ATTACK_BLOCKED",
      message: "SQL Injection pattern detected. Access denied." 
    });
  }

  res.json({ 
    success: true, 
    status: "SECURE_QUERY", 
    message: "Input query validated. Request processed successfully." 
  });
});

// ==========================================
// MODULE 4: Intelligent Assistant Engine
// ==========================================
const botKnowledge = [
  { 
    keywords: ['hello', 'hi', 'greetings'], 
    response: "System active. How can I assist you with cloud operations?" 
  },
  { 
    keywords: ['security', 'aes', 'sql', 'encryption'], 
    response: "The security system employs AES-256 encryption for sensitive data and regex validation for SQL injection protection." 
  },
  { 
    keywords: ['redundancy', 'duplicate', 'hash', 'sha'], 
    response: "Data deduplication utilizes SHA-256 cryptographic hashing to prevent duplicate entries." 
  },
  { 
    keywords: ['cloud', 'architecture', 'infrastructure'], 
    response: "Cloud infrastructure delivers scalable compute, storage, and database services over secure networks." 
  }
];

app.post('/api/task4/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: "Please provide a valid input." });

  const cleanMsg = message.toLowerCase();
  const match = botKnowledge.find(k => k.keywords.some(kw => cleanMsg.includes(kw)));

  const reply = match 
    ? match.response 
    : "Automated Assistant: Query not recognized. Ask about encryption, deduplication, or system architecture.";

  res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening at http://localhost:${PORT}`));