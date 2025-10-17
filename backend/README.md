# Aero Blue Backend

This backend provides server-side features for the Aero Blue EVM Creator:
- User authentication (register/login with JWT)
- Persistent contract storage
- Flattening and compilation endpoints
- CREATE2 vanity search and compute
- Verification orchestration (Etherscan, Polygonscan, etc.)

Important: This is a development example. Harden before production.

Setup
1. Copy .env.example to .env and fill values (ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY, JWT_SECRET, OPERATOR_PRIVATE_KEY if needed).
2. Install dependencies:
   npm install
3. Run:
   npm run dev

Endpoints overview
- POST /api/auth/register { username, password }
- POST /api/auth/login { username, password }
- GET /api/contracts
- POST /api/contracts
- POST /api/flatten/preview { source }
- POST /api/compile { source }
- POST /api/create2/compute { deployer, salt, bytecode }
- POST /api/create2/vanity { deployer, bytecode, prefix, maxAttempts }
- POST /api/verify { address, source, contractName, compiler, chainId }

Security & Notes
- Add rate limits and quotas to /api/create2/vanity (CPU-heavy).
- Protect compile/flatten endpoints or require authentication for heavy operations.
- Store API keys securely and do not commit .env to git.