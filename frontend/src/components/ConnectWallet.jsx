import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "../config/chain";

function short(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return (
      <button
        className="primary"
        disabled={isPending}
        onClick={() => connect({ connector: connectors[0] })}
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  const wrongChain = chainId !== monadTestnet.id;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {wrongChain && (
        <button className="danger" onClick={() => switchChain({ chainId: monadTestnet.id })}>
          Switch to Monad Testnet
        </button>
      )}
      <span className="addr">{short(address)}</span>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}
