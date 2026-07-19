# Monad Spaces — Governance-Agnostic DAO Framework

A guide to how the framework works, and a full walkthrough of deploying it —
from the smart contracts in Foundry, to a live web UI on Vercel.

---

## Part 1 — How the Framework Works

### The core idea

Most DAO tooling bundles two things together that don't need to be bundled:
**where the money lives** (the treasury) and **how decisions get made** (the
governance rules). Monad Spaces keeps them as two separate, swappable
pieces.

That separation is the whole point. A DAO's treasury can sit at the same
address, holding the same funds, indefinitely — while the rules for how the
group votes, what quorum means, how long a timelock lasts, or what counts as
approval can change over time, without ever migrating a single token out of
the treasury.

```
┌─────────────────┐        controls        ┌─────────────────┐
│    Governance    │ ─────────────────────▶ │     Treasury     │
│  (swappable —     │                        │  (stays put —     │
│   voting rules     │ ◀───────────────────── │   holds the funds) │
│   live here)        │      trusts            └─────────────────┘
└─────────────────┘
         │
         │ controls (mint rights)
         ▼
┌─────────────────┐
│  GovernanceToken  │
└─────────────────┘
```

### The four contracts

| Contract | Responsibility |
|---|---|
| **`Governance.sol`** | Orchestrates everything — proposal creation, voting, quorum/approval enforcement, timelocks, and execution. This is the piece that's meant to be swappable. |
| **`Treasury.sol`** | Holds the DAO's funds (ETH and ERC20 tokens). Only takes instructions from whichever address is currently registered as its `governance`. |
| **`GovernanceToken.sol`** | An ERC20 with built-in vote-delegation and historical checkpoints (via OpenZeppelin's `ERC20Votes`). Minting is controlled by whichever address is the current `owner` — which, after deployment, is the DAO's `Governance` contract. |
| **`DAOFactory.sol`** | Deploys a fresh `GovernanceToken` + `Treasury` + `Governance` set for each new DAO, and wires them together correctly in a single transaction. |

### Why governance and treasury are decoupled

Every one of Treasury's fund-moving functions is gated by a single check:
*"is the caller the address I currently trust as governance?"* That trusted
address is just a variable (`governance`) — not hardcoded, not baked into
the treasury's identity. It can be updated via `transferGovernance()`,
callable only by whoever currently holds that role.

That means a DAO can, through its own governance process, vote to swap out
its entire decision-making system — say, moving from a simple
majority-vote model to a quadratic-voting model, or a delegate-council
model — by deploying a **new** `Governance` contract and pointing the
existing `Treasury` at it. The funds never move. Only the rulebook changes.

This is the gap the framework is built to close. Most EVM chains handle DAO
governance one of two ways today:

- **Snapshot** (off-chain voting) — votes are just signed messages, not
  transactions. Nothing is actually enforced by the blockchain. Someone
  still has to manually go and execute whatever the vote decided, by hand,
  after the fact.
- **A custom-built, one-off governance system** — hard to build correctly,
  and once it's live, it's usually locked in. Changing the rules later
  means migrating the whole treasury to a new setup, which is risky and
  disruptive.

Monad Spaces is built so everything a DAO votes on is carried out
automatically, fully on-chain — and so the governance rules themselves can
evolve without the treasury ever having to move.

### The proposal lifecycle

Every action a DAO takes — moving treasury funds, minting tokens, changing
governance settings, even swapping to a new `Governance` contract — goes
through the same pipeline:

```
Pending → Active → Succeeded / Defeated → Queued → Executed
                                              │
                                        (timelock delay
                                         must elapse first)
```

1. **Propose** — anyone with enough delegated voting power creates a
   proposal: one or more actions (target address, ETH value, calldata),
   plus a description.
2. **Voting delay** — a short buffer before voting opens, so voting power
   is snapshotted before anyone can react to the proposal's contents.
3. **Active** — token holders who have **delegated** their voting power
   (even to themselves) can vote For, Against, or Abstain.
4. **Succeeded / Defeated** — determined by two independent checks:
   **quorum** (did enough total voting power participate?) and
   **approval** (did enough of the *decisive* votes come in For?).
5. **Queued** — once succeeded, anyone can queue the proposal, which starts
   the **timelock** — a mandatory waiting period before execution.
6. **Executed** — once the timelock has passed (and before the execution
   window expires), anyone can trigger execution. The contract carries out
   every action in the proposal directly — no manual step, nothing left to
   trust.

No one — not voters, not the proposer, not even the DAO's original creator
— can skip any of these steps or act unilaterally. The only way to move
treasury funds, mint tokens, or reconfigure governance is through this full
pipeline, every time.

---

## Part 2 — Deploying the Contracts (Foundry)

### 2.1 Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed (`forge`, `cast`, `anvil`)
- A wallet with testnet funds on your target chain (Monad Testnet, in this
  project's case — faucet + network details at
  [docs.monad.xyz](https://docs.monad.xyz))
- The repo cloned locally, with submodules pulled:
  ```bash
  git clone https://github.com/<you>/monad-spaces.git
  cd monad-spaces
  git submodule update --init --recursive
  ```

### 2.2 Install dependencies and build

```bash
forge install
forge build
```

If you hit an `mcopy`-related compile error, your EVM target needs bumping
to Cancun — add this to `foundry.toml`:

```toml
[profile.default]
evm_version = "cancun"
```

### 2.3 Run the test suite

```bash
forge test
```

This runs the full suite covering `Governance`, `Treasury`,
`GovernanceToken`, `DAOFactory`, and end-to-end integration flows —
including every quorum/approval/timelock edge case. All tests should pass
before deploying anywhere real.

### 2.4 Deploy the factory (once)

The factory is deployed a single time — every DAO after that is created
*through* it, not by redeploying it.

```bash
forge script script/DeployDAOFactory.s.sol:DeployDAOFactory \
  --rpc-url <RPC_URL> \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Save the printed `DAOFactory` address — you'll need it for both future DAO
creation and the frontend.

### 2.5 Create an actual DAO through the factory

```bash
export FACTORY_ADDRESS=0xYourFactoryAddress
export DAO_NAME="Ark DAO"
export DAO_SYMBOL="ARK"
export INITIAL_SUPPLY=1000000
export MAX_SUPPLY=10000000

forge script script/CreateDAO.s.sol:CreateDAO \
  --rpc-url <RPC_URL> \
  --private-key $PRIVATE_KEY \
  --broadcast
```

This deploys a fresh `GovernanceToken` + `Treasury` + `Governance` set,
wires them together, and logs all three addresses.

> **Security note:** for real deployments, avoid passing `--private-key`
> directly on the command line (it lands in shell history). Use
> `--interactive`, a hardware wallet flag (`--ledger` / `--trezor`), or an
> encrypted `cast wallet` keystore instead.

---

## Part 3 — Deploying the UI (Vercel)

### 3.1 Point the frontend at your factory

In `frontend/src/config/contracts.js`, set:

```js
export const DAO_FACTORY_ADDRESS = "0xYourDeployedFactoryAddress";
```

This gets baked into the build — update it and redeploy if it ever changes.

### 3.2 Confirm `.gitignore` is correct before committing

The frontend's own `node_modules` and `dist` should **never** be committed
— they're huge, and binaries built on one machine won't necessarily work on
Vercel's build servers. Confirm `frontend/.gitignore` contains:

```
node_modules/
dist/
.env
```

If `node_modules` was accidentally committed already, untrack it (without
deleting it locally):

```bash
git rm -r --cached frontend/node_modules
git add frontend/.gitignore
git commit -m "Stop tracking node_modules"
git push origin main
```

### 3.3 Push the frontend into your existing contracts repo

```bash
cd monad-spaces
git add frontend/
git commit -m "Add DAO console frontend"
git push origin main
```

Contracts and UI now live in the same repo, in separate folders.

### 3.4 Import the repo into Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. **Add New → Project** → select your repo
3. Before deploying, set:
   - **Root Directory** → `frontend` *(critical — without this, Vercel
     tries to build from the repo root, where there's no `package.json`,
     and the build fails immediately)*
   - **Project Name** → whatever you want your `.vercel.app` subdomain to
     be, e.g. `monad-spaces`
   - **Framework Preset** → should auto-detect as **Vite** once Root
     Directory is set
   - **Build Command** → `npm run build` (auto-filled)
   - **Output Directory** → `dist` (auto-filled)
4. Click **Deploy**

You'll get a live URL within about a minute:

```
https://monad-spaces.vercel.app
```

### 3.5 Verify it's actually live

- Open the URL, connect a wallet
- Confirm Monad Testnet is added (chain ID `10143`, RPC
  `https://testnet-rpc.monad.xyz`)
- Confirm the "Create a DAO" form loads with no console errors — this is
  the moment that would surface a misconfigured `DAO_FACTORY_ADDRESS`

### 3.6 Ongoing deploys

Every `git push` to `main` from here on triggers an automatic Vercel
rebuild and redeploy — no repeat of the setup steps needed.

---

## Part 4 — Using the Live UI

Once deployed, the flow for a visitor is:

1. **Connect wallet** (MetaMask or similar), on Monad Testnet
2. **Create a DAO** — deploys a fresh token/treasury/governance set via the
   factory
3. **Delegate** — activates voting power (required even for self-holdings;
   tokens carry zero voting weight until explicitly delegated)
4. **Propose** — target address, ETH value, calldata, and a description
5. **Vote** — For / Against / Abstain, while the proposal is Active
6. **Queue** — once a proposal succeeds
7. **Execute** — once the timelock has elapsed

Each proposal shows its live lifecycle state and only presents the action
that's currently valid — so there's no way to accidentally try to execute
something that hasn't cleared its timelock, or vote on something that's
already closed.
