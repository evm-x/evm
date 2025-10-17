const express = require('express');
const etherscan = require('../services/etherscan');

const router = express.Router();

/**
 * POST /api/verify
 * body: { address, source, compiler, metadata?, contractName?, chainId? }
 * This enqueues / sends a verification request to the target explorer.
 */
router.post('/', async (req,res)=>{
  try {
    const db = req.db;
    const payload = req.body;
    if(!payload || !payload.address || !payload.source) return res.status(400).json({ error: 'address & source required' });
    const chainId = payload.chainId || 1;
    await db.read();
    const rec = { id: Date.now().toString(), address: payload.address, chainId, source: payload.source, compiler: payload.compiler, contractName: payload.contractName, status: 'queued', created_at: new Date().toISOString() };
    db.data.verifications.unshift(rec);
    await db.write();
    const result = await etherscan.submitVerification({ address: payload.address, source: payload.source, compiler: payload.compiler, contractName: payload.contractName, chainId });
    rec.status = result.success ? 'submitted' : 'failed';
    rec.result = result;
    await db.write();
    return res.json({ status: rec.status, result });
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;