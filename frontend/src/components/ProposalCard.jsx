import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { abis, VoteType, ProposalStateLabels } from "../config/contracts";

// Order mirrors the "happy path" through ProposalState - used only to
// render the lifecycle bar; Defeated/Cancelled/Expired short-circuit it.
const HAPPY_PATH = ["Pending", "Active", "Succeeded", "Queued", "Executed"];
const TERMINAL_FAILURE_STATES = ["Defeated", "Cancelled", "Expired"];

export default function ProposalCard({ proposalId, governanceAddress, onChanged }) {
  const { address } = useAccount();

  const { data, refetch } = useReadContracts({
    contracts: [
      { address: governanceAddress, abi: abis.Governance, functionName: "getProposal", args: [proposalId] },
      { address: governanceAddress, abi: abis.Governance, functionName: "state", args: [proposalId] },
      { address: governanceAddress, abi: abis.Governance, functionName: "quorumVotes", args: [proposalId] },
      { address: governanceAddress, abi: abis.Governance, functionName: "executableAfter", args: [proposalId] },
    ],
    query: { enabled: Boolean(governanceAddress) },
  });

  const { writeContract, isPending } = useWriteContract();

  if (!data || !data[0].result) return null;

  const proposal = data[0].result;
  const stateIndex = data[1].result !== undefined ? Number(data[1].result) : 0;
  const quorumVotes = data[2].result;
  const executableAfter = data[3].result;
  const stateLabel = ProposalStateLabels[stateIndex] ?? "Unknown";

  const isProposer = address && proposal.proposer.toLowerCase() === address.toLowerCase();
  const timelockPassed = executableAfter && executableAfter > 0n
    ? BigInt(Math.floor(Date.now() / 1000)) >= executableAfter
    : false;

  function act(functionName, args = [], value) {
    writeContract(
      { address: governanceAddress, abi: abis.Governance, functionName, args, value },
      { onSuccess: () => { refetch(); onChanged?.(); } }
    );
  }

  const busy = isPending;
  const totalActionValue = proposal.actions.reduce((sum, a) => sum + a.value, 0n);

  return (
    <div className="proposal-card">
      <div className="proposal-card-top">
        <div>
          <div className="mono" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            #{proposal.id.toString()}
          </div>
          <div style={{ fontWeight: 600 }}>{proposal.metadataURI}</div>
          <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>
            proposer: <span className="mono">{proposal.proposer}</span>
          </div>
        </div>
        <span className={`state-pill state-${stateLabel.toLowerCase()}`}>{stateLabel}</span>
      </div>

      <Lifecycle stateLabel={stateLabel} />

      <div className="vote-tally">
        <span className="for">For {formatEther(proposal.forVotes)}</span>
        <span className="against">Against {formatEther(proposal.againstVotes)}</span>
        <span className="abstain">Abstain {formatEther(proposal.abstainVotes)}</span>
        {quorumVotes !== undefined && (
          <span className="muted">· quorum needs {formatEther(quorumVotes)}</span>
        )}
      </div>

      <div className="proposal-actions">
        {stateLabel === "Active" && (
          <>
            <button disabled={busy} onClick={() => act("castVote", [proposalId, VoteType.For])}>
              Vote For
            </button>
            <button disabled={busy} onClick={() => act("castVote", [proposalId, VoteType.Against])}>
              Vote Against
            </button>
            <button disabled={busy} onClick={() => act("castVote", [proposalId, VoteType.Abstain])}>
              Abstain
            </button>
          </>
        )}

        {stateLabel === "Succeeded" && (
          <button className="primary" disabled={busy} onClick={() => act("queueProposal", [proposalId])}>
            Queue
          </button>
        )}

        {stateLabel === "Queued" && (
          <button
            className="primary"
            disabled={busy || !timelockPassed}
            title={!timelockPassed ? `Executable after ${new Date(Number(executableAfter) * 1000).toLocaleString()}` : ""}
            onClick={() => act("executeProposal", [proposalId], totalActionValue)}
          >
            {timelockPassed ? "Execute" : `Executable ${new Date(Number(executableAfter) * 1000).toLocaleTimeString()}`}
          </button>
        )}

        {isProposer && !proposal.executed && !proposal.cancelled && (
          <button className="danger" disabled={busy} onClick={() => act("cancelProposal", [proposalId])}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function Lifecycle({ stateLabel }) {
  const failed = TERMINAL_FAILURE_STATES.includes(stateLabel);
  const currentIndex = failed ? HAPPY_PATH.length : HAPPY_PATH.indexOf(stateLabel);

  return (
    <div className="lifecycle">
      {HAPPY_PATH.map((step, i) => (
        <div
          key={step}
          className={`lifecycle-step ${i <= currentIndex ? (failed && i === currentIndex - 1 ? "failed" : "done") : ""}`}
          title={step}
        />
      ))}
    </div>
  );
}
