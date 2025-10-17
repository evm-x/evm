const { ethers } = require('ethers');

async function resolveName(providerOrUrl, name){
  const provider = typeof providerOrUrl === 'string' ? new ethers.providers.JsonRpcProvider(providerOrUrl) : providerOrUrl;
  const address = await provider.resolveName(name);
  return address;
}

async function registerName(){ throw new Error('Registration must be implemented per network & registrar. Use manual flow or implement carefully.'); }

module.exports = { resolveName, registerName };