import { useState } from "react";
import { isAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { DAO_FACTORY_ADDRESS, abis } from "../config/contracts";

function short(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function DAOSelector({ onSelect }) {
  const { address } = useAccount();
  const [manualAddress, setManualAddress] = useState("");

  const { data: creatorDAOs, isLoading } = useReadContract({
    address: DAO_FACTORY_ADDRESS,
    abi: abis.DAOFactory,
    functionName: "getCreatorDAOs",
    args: [address],
    query: { enabled: Boolean(address) },
  });

  return (
    <div className="panel">
      <h2>Open a DAO</h2>

      {isLoading && <p className="muted">Loading your DAOs…</p>}

      {creatorDAOs && creatorDAOs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }} className="muted">
            DAOs you've created
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {creatorDAOs.map((gov) => (
              <button key={gov} onClick={() => onSelect(gov)} style={{ textAlign: "left" }}>
                <span className="mono">{short(gov)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>Or paste a Governance address</label>
        <input
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="0x..."
        />
      </div>
      <button
        className="primary"
        disabled={!isAddress(manualAddress)}
        onClick={() => onSelect(manualAddress)}
      >
        Open
      </button>
    </div>
  );
}
