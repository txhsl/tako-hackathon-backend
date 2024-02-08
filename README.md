# tako-hackathon-backend

This repository contains the server program and the smart contract of **Tumpra**, which will participant [DeSoc Hackathon S1](https://build.bewater.xyz/en/campaigns/HK6L-DeSoc-Hackathon-S1).

## Mathematical Model

The credit of a borrower determines the token amount limit he can raise through **Tumpra**. The credit is always evaluated based on the borrower's socialFi activities, as following,

$raiseLimit=socialCredit\ast tumpraBehave\ast unitAmount$

While,

$socialCredit=log(lensFollowerAmount+farcasterFollowerAmount+friendtechHolderAmount)$

And,

$tumpraBehave=0.9^{max(overdueTimes-punctualTimes, 0)}$

Besides, since we deploy the **Tumpra** contract on Mumbai, the $unitAmount$ is setted to 10 MATIC.

## Server API

The server program only provides credit evaluation service, and there are 2 methods can be requested.

- `/stats/{address}` - which returns all related socialFi activity data for web page display;
- `/evaluate/{address}` - which returns an evaluated **Tumpra** credit with a signature, with which a borrower can invoke the **Tumpra** contract and set up a Vault for raising tokens.

## Contract ABI

The smart contract provides DeFi functionality including Stake, Borrow, Repay and Withdraw.

A **Tumpra** Vault is defined as,

```solidity
struct Vault {
    uint256 amount; // the amount limit
    uint256 startTime; // after which the borrower can use raised tokens
    uint256 endTime; // before which the borrower should repay the tokens and benefits
    uint256 feeRate; // the benefit rate for stakers 
}
```

- `setVault(Message calldata _evl, Vault calldata _vault, bytes memory _signature)` - a borrower can only set up one Vault with the server's signature, and the raising amount is limited by borrower's credit;
- `stake(address _to)` - a staker can only stake to a Vault before `startTime`;
- `borrow()` - the borrower can only use raised tokens after `startTime` and before `endTime`;
- `repay()` - the borrower should repay the tokens and benefits before `endTime`;
- `withdraw(address _from)` - a staker can withdraw his tokens after `endTime` when the borrower rapays.

There are some other rules that are defined in the contract,

1. A borrower can only have 1 Vault, and cannot raise tokens again without repay first;
2. The amount limit of a Vault is not always the amount that a borrower can get, if the limit is 100 MATIC but the Vault raises 50 MATIC, then only 50 MATIC can be borrowed;
3. Any delayed repay will increase the `overdueCount` and somehow affect the borrower's credit;
4. Good behaves in **Tumpra** will not increase Vault amount limit;
5. There is a cool off time when a Vault ends for stakers to withdraw their tokens, left staking will be frozen in the next Vault and cannot share the benefit;
6. As a demo, the cool off time is setted to 0 for now.
