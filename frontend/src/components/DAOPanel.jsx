import { useState } from "react";
import { useReadContracts } from "wagmi";
import { abis } from "../config/contracts";
import TokenPanel from "./TokenPanel";
import NewProposalForm from "./NewProposalForm";
import ProposalList from "./ProposalList";

export default function DAOPanel({ governanceAddress, onBack }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data } = useReadContracts({
    contracts: [
      { address: governanceAddress, abi: abis.Governance, functionName: "daoName" },
      { address: governanceAddress, abi: abis.Governance, functionName: "governanceToken" },
      { address: governanceAddress, abi: abis.Governance, functionName: "treasury" },
    ],
    query: { enabled: Boolean(governanceAddress) },
  });

  const daoName = data?.[0]?.result;
  const tokenAddress = data?.[1]?.result;
  const treasuryAddress = data?.[2]?.result;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="muted" style={{ fontSize: "0.75rem" }}>Governance</div>
          <div className="mono">{governanceAddress}</div>
        </div>
        <button onClick={onBack}>← Back</button>
      </div>

      {daoName && (
        <div className="panel">
          <h2>{daoName}</h2>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Token: <span className="mono">{tokenAddress}</span>
          </div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Treasury: <span className="mono">{treasuryAddress}</span>
          </div>
        </div>
      )}

      {tokenAddress && <TokenPanel tokenAddress={tokenAddress} />}

      <NewProposalForm
        governanceAddress={governanceAddress}
        onProposed={() => setRefreshKey((k) => k + 1)}
      />

      <ProposalList
        governanceAddress={governanceAddress}
        tokenAddress={tokenAddress}
        refreshKey={refreshKey}
      />
    </div>
  );
}
