const express = require('express');
const router = express.Router();

// GET /api/contracts
router.get('/', async (req,res)=>{
  const db = req.db;
  await db.read();
  res.json(db.data.contracts || []);
});

// GET /api/contracts/:address
router.get('/:address', async (req,res)=>{
  const db = req.db;
  const address = (req.params.address || '').toLowerCase();
  await db.read();
  const found = (db.data.contracts || []).find(c => (c.address||'').toLowerCase() === address);
  if(!found) return res.status(404).json({ error: 'not found' });
  res.json(found);
});

// POST /api/contracts { address, name, chainId, txHash, abi, bytecode, source, compiler, ownerUserId? }
router.post('/', async (req,res)=>{
  const db = req.db;
  const payload = req.body;
  if(!payload || !payload.address) return res.status(400).json({ error: 'address required' });
  await db.read();
  const exists = (db.data.contracts || []).find(c => (c.address||'').toLowerCase() === (payload.address||'').toLowerCase());
  if(exists){
    Object.assign(exists, payload, { updated_at: new Date().toISOString() });
    await db.write();
    return res.json(exists);
  } else {
    const rec = Object.assign({}, payload, { created_at: new Date().toISOString() });
    db.data.contracts.unshift(rec);
    await db.write();
    return res.status(201).json(rec);
  }
});

module.exports = router;