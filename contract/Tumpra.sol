// SPDX-License-Identifier: MIT
pragma solidity = 0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Tumpra is EIP712 {
    using ECDSA for bytes32;

    struct Vault {
        address borrower;
        uint256 rank;
    }

    bytes32 constant VAULT_TYPE_HASH = keccak256("Vault(address borrower,uint256 rank)");
    address constant ADMIN = 0x77c6a598E577a507288b14D6Aa976776F519B974;
    uint256 constant FACTOR = 100 ether;
    uint256 constant DURATION = 1 weeks;
    uint256 constant FEE_RATE = 3;

    mapping(address => uint256) vaultsLimit;
    mapping(address => uint256) vaultsBorrowed;
    mapping(address => uint256) vaultsDeadline;

    constructor() EIP712("Tumpra", "1") {}

    function hash(Vault calldata _vault) internal pure returns (bytes32) {
        return keccak256(abi.encode(VAULT_TYPE_HASH, _vault.borrower, _vault.rank));
    }

    function setVault(Vault calldata _vault, bytes memory _signature) public returns (uint256) {
        // verify sig
        bytes32 structHash = hash(_vault);
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, _signature);
        require(ADMIN == signer, "invalid signer");
        require(msg.sender == _vault.borrower, "invalid sender");
        
        // create vault
        require(vaultsLimit[_vault.borrower] == 0, "vault exists");
        vaultsLimit[_vault.borrower] = _vault.rank * FACTOR;
        vaultsDeadline[_vault.borrower] = block.timestamp + DURATION;
        return vaultsDeadline[_vault.borrower];
    }

    function stake(address to) public payable returns (uint256) {
        require(vaultsLimit[to] == 0, "vault not exists");
        require(vaultsDeadline[to] >= block.timestamp, "vault closed");
        require(vaultsLimit[to] >= vaultsBorrowed[to] + msg.value, "exceed vault limit");

        vaultsBorrowed[to] += msg.value;
        return vaultsDeadline[to];
    }
}