const axios = require('axios');
const path = require('path');
const solcManager = require('../solc-manager');

function escapeRegExp(string){ return string.replace(/[.*+?^${}()|[\\]\\/]/g, '\\$&'); }

async function fetchImport(pathStr){
  if(pathStr.startsWith('@openzeppelin/')){
    const url = 'https://unpkg.com/' + pathStr;
    try { const r = await axios.get(url); return r.data; } catch(e){
      const fallback = 'https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/' + pathStr.replace('@openzeppelin/', 'contracts/');
      const r2 = await axios.get(fallback);
      return r2.data;
    }
  }
  if(pathStr.startsWith('http://') || pathStr.startsWith('https://')){
    const r = await axios.get(pathStr); return r.data;
  }
  try {
    const r = await axios.get('https://unpkg.com/' + pathStr);
    return r.data;
  } catch(e){
    return null;
  }
}

async function resolveImportsRecursive(source, basePath = '', visited = new Map()){
  const importRegex = /import\s+["']([^"']+)["'];/g;
  let match;
  let out = source;
  const imports = [];
  while((match = importRegex.exec(source)) !== null){ imports.push(match[1]); }
  for(const imp of imports){
    if(visited.has(imp)) continue;
    visited.set(imp, true);
    let resolvedText = null;
    if(imp.startsWith('./') || imp.startsWith('../')){
      if(basePath && (basePath.startsWith('http://') || basePath.startsWith('https://'))){
        const url = new URL(imp, basePath).href;
        try { const r = await axios.get(url); resolvedText = r.data; }
        catch(e){}
      }
    } else {
      resolvedText = await fetchImport(imp);
    }
    if(!resolvedText){ resolvedText = `/* UNRESOLVED_IMPORT: ${imp} */`; }
    else {
      let derivedBase = '';
      if(imp.startsWith('http')) derivedBase = imp;
      else if(imp.startsWith('@')) derivedBase = 'https://unpkg.com/' + imp.replace(/\/[^\/]+$/, '/');
      const nested = await resolveImportsRecursive(resolvedText, derivedBase, visited);
      resolvedText = nested;
    }
    const importRegexSingle = new RegExp(`import\\s+["']${escapeRegExp(imp)}["'];`);
    out = out.replace(importRegexSingle, `\n/* --- begin import ${imp} --- */\n${resolvedText}\n/* --- end import ${imp} --- */\n`);
  }
  return out;
}

async function flattenPreview(source){ return await resolveImportsRecursive(source, '', new Map()); }

async function compileSource(source){
  const flattened = await flattenPreview(source);
  if(solcManager && solcManager.getActive){
    const comp = solcManager.getActive();
    if(comp && comp.compileStandardWrapper){
      const input = { language: 'Solidity', sources: { 'Contract.sol': { content: flattened } }, settings: { outputSelection: { '*': { '*': ['abi','evm.bytecode','metadata'] } } } };
      const out = comp.compileStandardWrapper(input);
      const contracts = out.contracts && out.contracts['Contract.sol'] ? out.contracts['Contract.sol'] : {};
      const first = Object.keys(contracts)[0];
      const compiled = contracts[first];
      const abi = compiled.abi;
      const bytecode = compiled.evm && compiled.evm.bytecode && compiled.evm.bytecode.object ? compiled.evm.bytecode.object : '';
      return { abi, bytecode, contractName: first, source: flattened, raw: compiled };
    }
  }
  return { abi: null, bytecode: null, contractName: null, source: flattened };
}

module.exports = { flattenPreview, compileSource };