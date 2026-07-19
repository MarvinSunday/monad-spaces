import { useEffect } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { abis } from "../config/contracts";

export default function TokenPanel({ tokenAddress }) {
  const { address } = useAccount();

  const { data, refetch } = useReadContracts({
    contracts: [
      { address: tokenAddress, abi: abis.GovernanceToken, functionName: "symbol" },
      { address: tokenAddress, abi: abis.GovernanceToken, functionName: "balanceOf", args: [address] },
      { address: tokenAddress, abi: abis.GovernanceToken, functionName: "getVotes", args: [address] },
      { address: tokenAddress, abi: abis.GovernanceToken, functionName: "delegates", args: [address] },
    ],
    query: { enabled: Boolean(address && tokenAddress) },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  const symbol = data?.[0]?.result;
  const balance = data?.[1]?.result;
  const votes = data?.[2]?.result;
  const delegatedTo = data?.[3]?.result;

  const isSelfDelegated = delegatedTo && address && delegatedTo.toLowerCase() === address.toLowerCase();

  return (
    <div className="panel">
      <h2>Your voting power</h2>
      <div className="field-row">
        <div>
          <div className="muted">Balance</div>
          <div className="mono">{balance !== undefined ? `${formatEther(balance)} ${symbol ?? ""}` : "—"}</div>
        </div>
        <div>
          <div className="muted">Active voting power</div>
          <div className="mono">{votes !== undefined ? formatEther(votes) : "—"}</div>
        </div>
      </div>

      {!isSelfDelegated && (
        <>
          <p className="muted" style={{ marginTop: 12 }}>
            Your tokens carry no voting power until you delegate — even to
            yourself. This is a one-time action per address.
          </p>
          <button
            className="primary"
            disabled={isPending || isConfirming}
            onClick={() =>
              writeContract({
                address: tokenAddress,
                abi: abis.GovernanceToken,
                functionName: "delegate",
                args: [address],
              })
            }
          >
            {isPending || isConfirming ? "Delegating…" : "Delegate to myself"}
          </button>
        </>
      )}
    </div>
  );
}
