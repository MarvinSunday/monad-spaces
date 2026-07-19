import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DAO_FACTORY_ADDRESS, abis } from "../config/contracts";

// Default governance config: 10% quorum, 60% approval, 1 block voting
// delay, ~1 week voting period (assuming ~1s Monad blocks), 1 day timelock,
// 7 day execution window, no proposal threshold. Edit to taste for testing.
const DEFAULT_CONFIG = {
  quorumBps: 1_000,
  approvalThresholdBps: 6_000,
  votingDelay: 1,
  votingPeriod: 50_400,
  timelockDelay: 60 * 5, // 5 minutes, shortened for quick test runs
  executionPeriod: 60 * 60 * 24 * 7,
  proposalThreshold: 0n,
};

export default function CreateDAO({ onCreated }) {
  const { isConnected } = useAccount();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("1000000");
  const [maxSupply, setMaxSupply] = useState("10000000");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e) {
    e.preventDefault();
    writeContract({
      address: DAO_FACTORY_ADDRESS,
      abi: abis.DAOFactory,
      functionName: "createDAO",
      args: [
        name,
        symbol,
        parseEther(initialSupply || "0"),
        parseEther(maxSupply || "0"),
        DEFAULT_CONFIG,
      ],
    });
  }

  return (
    <div className="panel">
      <h2>Create a DAO</h2>
      <form onSubmit={handleSubmit}>
        <div className="field-row">
          <div className="field">
            <label>DAO name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ark DAO" required />
          </div>
          <div className="field">
            <label>Token symbol</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="ARK" required />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Initial supply (whole tokens)</label>
            <input
              value={initialSupply}
              onChange={(e) => setInitialSupply(e.target.value)}
              placeholder="1000000"
            />
          </div>
          <div className="field">
            <label>Max supply (whole tokens)</label>
            <input value={maxSupply} onChange={(e) => setMaxSupply(e.target.value)} placeholder="10000000" />
          </div>
        </div>
        <button type="submit" className="primary" disabled={!isConnected || isPending || isConfirming}>
          {isPending || isConfirming ? "Deploying…" : "Create DAO"}
        </button>
      </form>

      {hash && <div className="status-line">tx: {hash}</div>}
      {error && <div className="error-text">{error.shortMessage || error.message}</div>}
      {isSuccess && (
        <div className="status-line" style={{ color: "var(--ok)" }}>
          DAO deployed. Check the transaction on the explorer for the new
          Governance address, or use "Load an existing DAO" once you have it.
          <div style={{ marginTop: 8 }}>
            <button onClick={onCreated}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
