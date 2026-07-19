// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../governance/Governance.sol";
import "../treasury/Treasury.sol";
import "../token/GovernanceToken.sol";
import "../governance/Types.sol";
import "./IDAOFactory.sol";

/// @title DAOFactory
/// @notice Deploys and wires together a governance token, treasury and
///         governance contract for a new DAO.
/// @dev Deployment order matters here because of a circular dependency:
///      Treasury and GovernanceToken must exist before Governance can be
///      constructed (Governance's constructor takes their addresses), but
///      Treasury and GovernanceToken each need to recognize Governance as
///      their controller once it exists. The factory itself is temporarily
///      installed as the controller of both (as the initial Ownable owner of
///      the token, and as the initial `governance` of the Treasury), and
///      hands control off to the real Governance contract immediately after
///      it is deployed, within the same transaction.
contract DAOFactory is IDAOFactory {
    uint256 public daoCount;
    mapping(uint256 => DAOInfo) public daos;
    mapping(address => address[]) public creatorDAOs;

    function createDAO(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        uint256 maxSupply,
        GovernanceConfig calldata config
    ) external returns (address governance) {
        // Initial supply goes to the DAO creator; the factory is only the
        // temporary Ownable owner so it can hand off minting rights to
        // Governance once Governance exists.
        GovernanceToken token = new GovernanceToken(
            name,
            symbol,
            initialSupply,
            maxSupply,
            msg.sender,
            address(this)
        );
        Treasury treasury = new Treasury(address(this));

        Governance gov = new Governance(
            name,
            msg.sender,
            address(token),
            address(treasury),
            config
        );
        governance = address(gov);

        treasury.transferGovernance(governance);
        token.transferOwnership(governance);

        daoCount++;
        daos[daoCount] = DAOInfo(
            name,
            msg.sender,
            address(token),
            governance,
            address(treasury),
            block.timestamp
        );
        creatorDAOs[msg.sender].push(governance);

        emit DAOCreated(daoCount, msg.sender, governance, address(treasury), address(token));
    }

    function getCreatorDAOs(address creator) external view returns (address[] memory) {
        return creatorDAOs[creator];
    }
}
