require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const authRoutes = require('./routes/auth');
const contractsRoutes = require('./routes/contracts');
const verifyRoutes = require('./routes/verify');
const flattener = require('./services/flattener');
const create2Service = require('./services/create2');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// lowdb
const dbFile = path.join(__dirname, 'data.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function initDB(){
  await db.read();
  db.data ||= { users: [], contracts: [], verifications: [], deployers: [] };
  await db.write();
}
initDB();

// attach db to req
app.use((req,res,next)=>{ req.db = db; next(); });

// routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/verify', verifyRoutes);

// compilation & flatten endpoints
app.post('/api/flatten/preview', async (req,res)=>{
  try {
    const { source } = req.body;
    if(!source) return res.status(400).json({ error: 'source required' });
    const flattened = await flattener.flattenPreview(source);
    return res.json({ flattened });
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/compile', async (req,res)=>{
  try {
    const { source } = req.body;
    if(!source) return res.status(400).json({ error: 'source required' });
    const result = await flattener.compileSource(source);
    return res.json(result);
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// CREATE2 endpoints
app.post('/api/create2/compute', async (req,res)=>{
  try {
    const { deployer, salt, bytecode } = req.body;
    if(!deployer || !bytecode) return res.status(400).json({ error: 'deployer and bytecode required' });
    const r = create2Service.computeCreate2Address(deployer, salt, bytecode);
    return res.json(r);
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});
app.post('/api/create2/vanity', async (req,res)=>{
  try {
    const { deployer, bytecode, prefix, maxAttempts } = req.body;
    if(!deployer || !bytecode || !prefix) return res.status(400).json({ error: 'deployer, bytecode and prefix required' });
    const found = await create2Service.findVanitySalt(deployer, bytecode, prefix, Math.min(maxAttempts || 100000, 2000000));
    return res.json(found);
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Aero Blue backend running on port ${PORT}`));