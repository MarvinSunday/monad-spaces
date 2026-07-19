import { useReadContract } from "wagmi";
import { abis } from "../config/contracts";
import ProposalCard from "./ProposalCard";

export default function ProposalList({ governanceAddress, tokenAddress, refreshKey }) {
  const { data: count, refetch } = useReadContract({
    address: governanceAddress,
    abi: abis.Governance,
    functionName: "proposalCount",
    query: { enabled: Boolean(governanceAddress) },
  });

  const total = count !== undefined ? Number(count) : 0;

  return (
    <div className="panel">
      <h2>Proposals ({total})</h2>
      {total === 0 && <div className="empty-state">No proposals yet — create the first one above.</div>}
      {/* Newest first. */}
      {Array.from({ length: total }, (_, i) => total - i).map((id) => (
        <ProposalCard
          key={`${refreshKey}-${id}`}
          proposalId={BigInt(id)}
          governanceAddress={governanceAddress}
          tokenAddress={tokenAddress}
          onChanged={refetch}
        />
      ))}
    </div>
  );
}
