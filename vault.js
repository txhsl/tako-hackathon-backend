import Web3 from 'web3';
import fs from 'fs';
import sigUtil from 'eth-sig-util';

const MUMBAIENDPOINT = 'https://polygon-mumbai.g.alchemy.com/v2/A1L0c_nfqxeZo75pEmmT1KVdr-pFJRVd';
const PRVKEY = 'd10ef6953afeabc56c3b650946dd451108f14e71435c0c9a64e250da6f6dbee1';
const CONTRACT = '0xB84499CcD61d1720CF6a0F65bc06dBbbbdF1C7FB';

const EIP712TYPES = {
    EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
    ],
    Message: [
        { name: 'borrower', type: 'address' },
        { name: 'rank', type: 'uint256' },
    ]
};

const DOMAIN = {
    name: 'Tumpra',
    version: '1',
    chainId: 80001,
    verifyingContract: CONTRACT,
};

export const SignForEvaluate = (address, rank) => {
    // build eip-712 sig
    var typedData = {
        types: EIP712TYPES,
        primaryType: 'Message',
        domain: DOMAIN,
        message: {
            borrower: address,
            rank: rank,
        },
    };
    var sig = sigUtil.signTypedData_v4(Buffer.from(PRVKEY, 'hex'), { data: typedData });
    return sig;
};

export const GetOverdueFactor = async (address) => {
    var web3 = new Web3(new Web3.providers.HttpProvider(MUMBAIENDPOINT));
    var abi = JSON.parse(fs.readFileSync('public/Tumpra.json'));
    var tumpra = new web3.eth.Contract(abi, CONTRACT);
    var factor = await tumpra.methods.overdueFactor(address).call();

    return Number(factor);
};

export const SetUpTumpraListener = async () => {
    var web3 = new Web3(new Web3.providers.HttpProvider(MUMBAIENDPOINT));
    var abi = JSON.parse(fs.readFileSync('public/Tumpra.json'));
    var tumpra = new web3.eth.Contract(abi, CONTRACT);

    tumpra.events.NewVault({fromBlock: 0}, (error, event) => {})
    .on('data', (event) => {
        const borrower = event.returnValues.borrower;
        const amount = event.returnValues.amount;
        const startTime = event.returnValues.startTime;
        const endTime = event.returnValues.endTime;
        const feeRate = event.returnValues.feeRate;
        const timestamp = event.returnValues.timestamp;
    });

    tumpra.events.Stake({fromBlock: 0}, (error, event) => {})
    .on('data', (event) => {
        const staker = event.returnValues.staker;
        const to = event.returnValues.to;
        const amount = event.returnValues.amount;
        const timestamp = event.returnValues.timestamp;
    });

    tumpra.events.Borrow({fromBlock: 0}, (error, event) => {})
    .on('data', (event) => {
        const borrower = event.returnValues.borrower;
        const amount = event.returnValues.amount;
        const timestamp = event.returnValues.timestamp;
    });

    tumpra.events.Repay({fromBlock: 0}, (error, event) => {})
    .on('data', (event) => {
        const borrower = event.returnValues.borrower;
        const amount = event.returnValues.amount;
        const timestamp = event.returnValues.timestamp;
    });

    tumpra.events.Withdraw({fromBlock: 0}, (error, event) => {})
    .on('data', (event) => {
        const staker = event.returnValues.staker;
        const amount = event.returnValues.amount;
        const timestamp = event.returnValues.timestamp;
    });
};
