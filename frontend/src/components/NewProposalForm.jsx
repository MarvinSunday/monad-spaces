import { useState } from "react";
import { parseEther, isAddress } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { abis } from "../config/contracts";

export default function NewProposalForm({ governanceAddress, onProposed }) {
  const [target, setTarget] = useState("");
  const [value, setValue] = useState("0");
  const [data, setData] = useState("0x");
  const [metadataURI, setMetadataURI] = useState("");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e) {
    e.preventDefault();
    writeContract({
      address: governanceAddress,
      abi: abis.Governance,
      functionName: "propose",
      args: [
        [{ target, value: parseEther(value || "0"), data: data || "0x" }],
        metadataURI,
      ],
    });
  }

  return (
    <div className="panel">
      <h2>New proposal</h2>
      <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>
        This test UI supports a single action per proposal. The contract
        itself supports multiple actions — send an array via a script or
        console if you need that.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Target address</label>
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0x..." required />
        </div>
        <div className="field-row">
          <div className="field">
            <label>ETH value</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </div>
          <div className="field">
            <label>Calldata (hex, "0x" for none)</label>
            <input value={data} onChange={(e) => setData(e.target.value)} placeholder="0x" />
          </div>
        </div>
        <div className="field">
          <label>Description / metadata URI</label>
          <textarea
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            placeholder="ipfs://... or a plain description for testing"
            rows={2}
            required
          />
        </div>
        <button
          type="submit"
          className="primary"
          disabled={!isAddress(target) || isPending || isConfirming}
        >
          {isPending || isConfirming ? "Submitting…" : "Create proposal"}
        </button>
      </form>

      {error && <div className="error-text">{error.shortMessage || error.message}</div>}
      {isSuccess && (
        <div className="status-line" style={{ color: "var(--ok)" }}>
          Proposal submitted.
          <button style={{ marginLeft: 8 }} onClick={onProposed}>
            Refresh list
          </button>
        </div>
      )}
    </div>
  );
}
