import { useState } from "react";
import { useAccount } from "wagmi";
import ConnectWallet from "./components/ConnectWallet";
import CreateDAO from "./components/CreateDAO";
import DAOSelector from "./components/DAOSelector";
import DAOPanel from "./components/DAOPanel";
import { DAO_FACTORY_ADDRESS } from "./config/contracts";

export default function App() {
  const { isConnected } = useAccount();
  const [governanceAddress, setGovernanceAddress] = useState(null);

  const factoryNotConfigured = DAO_FACTORY_ADDRESS === "0x0000000000000000000000000000000000dEaD";

  return (
    <>
      <div className="app-header">
        <h1 className="app-title">
          Monad Spaces
          <span className="chain-tag">Monad Testnet</span>
        </h1>
        <ConnectWallet />
      </div>

      {factoryNotConfigured && (
        <div className="panel" style={{ borderColor: "var(--warn)" }}>
          <p className="muted" style={{ color: "var(--warn)" }}>
            Set <code>DAO_FACTORY_ADDRESS</code> in <code>src/config/contracts.js</code> to
            your deployed factory's address before using this.
          </p>
        </div>
      )}

      {!isConnected && (
        <div className="panel">
          <p className="muted">Connect a wallet to create or interact with a DAO.</p>
        </div>
      )}

      {isConnected && !governanceAddress && (
        <>
          <CreateDAO onCreated={() => {}} />
          <DAOSelector onSelect={setGovernanceAddress} />
        </>
      )}

      {isConnected && governanceAddress && (
        <DAOPanel governanceAddress={governanceAddress} onBack={() => setGovernanceAddress(null)} />
      )}
    </>
  );
}
