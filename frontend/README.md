# DAO Console (Monad Testnet)

A minimal React app to test-run the DAO governance contracts: create a DAO,
delegate voting power, propose, vote, queue, and execute — all against a
live deployment on Monad Testnet.

## Setup

1. **Set your factory address.** Open `src/config/contracts.js` and replace
   `DAO_FACTORY_ADDRESS` with the address printed by `DeployDAOFactory.s.sol`.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open the printed local URL (usually http://localhost:5173).

4. Connect a wallet (MetaMask or similar) with the Monad Testnet network
   added (chain ID 10143, RPC https://testnet-rpc.monad.xyz) and some
   testnet MON for gas.

## What it does

- **Create a DAO** — deploys a fresh GovernanceToken + Treasury + Governance
  set via the factory's `createDAO`.
- **Open a DAO** — lists DAOs you've created (via `getCreatorDAOs`), or paste
  any Governance address directly.
- **Delegate** — activates your voting power (required even for
  self-holdings — ERC20Votes needs an explicit delegation).
- **Propose** — single-action proposals (target, ETH value, calldata,
  description). The contract supports multi-action proposals; this UI just
  doesn't expose that for simplicity.
- **Vote / Queue / Execute** — each proposal card shows its live state and
  the relevant action button appears automatically as it becomes available.

## Notes

- ABIs in `src/abis/` were generated directly from the actual contract
  source (via `solc`) — if you change the contracts, regenerate these
  (`forge inspect <Contract> abi`) and drop them back in.
- This is a test-run tool, not a production frontend — no error boundary
  polish, no multi-action proposal builder, no ENS resolution, etc.
- Default governance config in `CreateDAO.jsx` uses a 5-minute timelock
  (shortened from the more realistic default in `CreateDAO.s.sol`) so you
  can walk through a full propose→execute cycle quickly while testing.
