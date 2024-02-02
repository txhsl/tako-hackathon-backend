// SPDX-License-Identifier: MIT
pragma solidity = 0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Tumpra is EIP712 {
    using ECDSA for bytes32;

    struct Message {
        address borrower;
        uint256 rank;
    }

    struct Vault {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 feeRate;
    }

    bytes32 constant MESSAGE_TYPE_HASH = keccak256("Message(address borrower,uint256 rank)");
    address constant ADMIN = 0x77c6a598E577a507288b14D6Aa976776F519B974;
    uint256 constant MINCOOLOFF = 0;
    uint256 constant FACTOR = 10 ether;

    mapping(address => Vault) public vaultsInfo;
    mapping(address => uint256) public vaultsCoolOff;
    mapping(address => uint256) public vaultsCollected;
    mapping(address => bool) public vaultsBorrowed;
    mapping(address => bool) public vaultsRepayed;
    mapping(address => mapping(address => uint256)) public stakes;

    constructor() EIP712("Tumpra", "1") {}

    function hash(Message calldata _req) internal pure returns (bytes32) {
        return keccak256(abi.encode(MESSAGE_TYPE_HASH, _req.borrower, _req.rank));
    }

    function setVault(Message calldata _evl, Vault calldata _vault, bytes memory _signature) external {
        // verify sig
        bytes32 structHash = hash(_evl);
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, _signature);
        require(ADMIN == signer, "invalid signer");
        require(msg.sender == _evl.borrower, "invalid sender");

        // verify vault
        require(_vault.amount <= _evl.rank * FACTOR && _vault.amount > 0, "invalid amount");
        require(_vault.startTime < _vault.endTime, "invalid time");
        require(vaultsInfo[_evl.borrower].amount == 0 || 
            (vaultsRepayed[_evl.borrower] && vaultsCoolOff[_evl.borrower] <= block.timestamp), "vault exists or cooling off");
        
        // reset state
        vaultsCollected[_evl.borrower] = 0;
        vaultsCoolOff[_evl.borrower] = 0;
        vaultsBorrowed[_evl.borrower] = false;
        vaultsRepayed[_evl.borrower] = false;

        // create vault
        vaultsInfo[_evl.borrower] = _vault;
    }

    function stake(address _to) external payable {
        // verify vault
        Vault memory v = vaultsInfo[_to];
        require(v.amount != 0, "vault not exists");
        require(v.startTime > block.timestamp, "stake closed");

        // verify amount
        uint256 collected = vaultsCollected[_to] + msg.value;
        require(v.amount >= collected, "exceed vault limit");

        // update vault, record reward immediately, but unlock after repay
        vaultsCollected[_to] = collected;
        stakes[msg.sender][_to] = msg.value * (1000 + v.feeRate) / 1000;
    }

    function borrow() external {
        // verify vault
        Vault memory v = vaultsInfo[msg.sender];
        require(v.amount != 0, "vault not exists");
        require(v.startTime <= block.timestamp, "vault not starts");
        require(v.endTime > block.timestamp, "vault ended");
        require(!vaultsBorrowed[msg.sender], "already borrowed");

        // update vault
        uint256 amount = vaultsCollected[msg.sender];
        vaultsBorrowed[msg.sender] = true;
        payable(msg.sender).transfer(amount);
    }

    function withdraw(address _from) external {
        // verify vault
        Vault memory v = vaultsInfo[_from];
        require(v.amount != 0, "vault not exists");
        require(v.endTime <= block.timestamp, "vault not ends");
        require(vaultsRepayed[_from], "vault not repays");

        // transfer
        uint256 amount = stakes[msg.sender][_from];
        delete stakes[msg.sender][_from];
        payable(msg.sender).transfer(amount);
    }

    function repay() external payable returns (uint256) {
        // verify vault
        Vault memory v = vaultsInfo[msg.sender];
        require(v.amount != 0, "vault not exists");
        require(v.startTime <= block.timestamp, "vault not starts");
        require(!vaultsRepayed[msg.sender], "already repayed");

        // verify amount
        if (!vaultsBorrowed[msg.sender]) {
            require(msg.value >= vaultsCollected[msg.sender] * v.feeRate / 1000, "invalid repay");
        } else {
            require(msg.value >= vaultsCollected[msg.sender] * (1000 + v.feeRate) / 1000, "invalid repay");
        }

        // update vault
        vaultsRepayed[msg.sender] = true;
        vaultsCoolOff[msg.sender] = block.timestamp + MINCOOLOFF;

        return vaultsCoolOff[msg.sender];
    }
}