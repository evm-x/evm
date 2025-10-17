let active = null;
try {
  const solc = require('solc');
  active = {
    name: solc.version ? solc.version() : 'local-solc',
    compileStandardWrapper: (input) => JSON.parse(solc.compile(JSON.stringify(input)))
  };
} catch(e){ active = null; }
module.exports = { getActive: () => active };