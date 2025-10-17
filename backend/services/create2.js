const ethers = require('ethers');

function computeCreate2Address(deployer, saltInput, bytecodeHex){
  let saltHex;
  if(!saltInput) saltHex = ethers.utils.hexZeroPad('0x00', 32);
  else if(saltInput.startsWith('0x')) saltHex = ethers.utils.hexZeroPad(saltInput, 32);
  else saltHex = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(saltInput));
  const initCodeHash = ethers.utils.keccak256(bytecodeHex.startsWith('0x') ? bytecodeHex : '0x' + bytecodeHex);
  const address = ethers.utils.getCreate2Address(deployer, saltHex, initCodeHash);
  return { address, saltHex, initCodeHash };
}

async function findVanitySalt(deployer, bytecodeHex, prefix, maxAttempts=100000){
  const target = prefix.toLowerCase();
  const bc = bytecodeHex.startsWith('0x') ? bytecodeHex : '0x' + bytecodeHex;
  for(let i=0;i<maxAttempts;i++){
    const saltCandidate = ethers.utils.hexlify(ethers.utils.randomBytes(8));
    const salt32 = ethers.utils.hexZeroPad(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(saltCandidate)), 32);
    const addr = ethers.utils.getCreate2Address(deployer, salt32, ethers.utils.keccak256(bc));
    if(addr.toLowerCase().replace('0x','').startsWith(target)){
      return { found: true, salt: salt32, address: addr, attempts: i+1 };
    }
    if(i % 10000 === 0) await new Promise(res => setImmediate(res));
  }
  return { found: false, attempts: maxAttempts };
}

module.exports = { computeCreate2Address, findVanitySalt };