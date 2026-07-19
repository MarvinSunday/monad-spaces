import GovernanceABI from "../abis/Governance.json";
import DAOFactoryABI from "../abis/DAOFactory.json";
import GovernanceTokenABI from "../abis/GovernanceToken.json";
import TreasuryABI from "../abis/Treasury.json";

// ⚠️ Replace this with your actual deployed DAOFactory address on Monad
// Testnet (the address printed by DeployDAOFactory.s.sol). Everything else
// (Governance, GovernanceToken, Treasury) is discovered per-DAO at runtime
// via factory.daos(daoId), since the factory deploys a fresh set for every
// DAO created.
export const DAO_FACTORY_ADDRESS = "0xA9b77627C7af32Aec3B7B17769a4500d37D586bE";

export const abis = {
  Governance: GovernanceABI,
  DAOFactory: DAOFactoryABI,
  GovernanceToken: GovernanceTokenABI,
  Treasury: TreasuryABI,
};

// Mirrors the Solidity enum in Types.sol - order matters, must match exactly.
export const VoteType = { Against: 0, For: 1, Abstain: 2 };

// Mirrors GovernanceState's ProposalState enum in Types.sol - order and
// count must match exactly (8 values, including Expired).
export const ProposalStateLabels = [
  "Pending",
  "Active",
  "Succeeded",
  "Queued",
  "Defeated",
  "Executed",
  "Cancelled",
  "Expired",
];
