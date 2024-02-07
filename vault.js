import Web3 from 'web3';
import fs from 'fs';
import sigUtil from 'eth-sig-util';

const MUMBAIENDPOINT = 'https://polygon-mumbai.g.alchemy.com/v2/A1L0c_nfqxeZo75pEmmT1KVdr-pFJRVd';
const PRVKEY = 'd10ef6953afeabc56c3b650946dd451108f14e71435c0c9a64e250da6f6dbee1';
const CONTRACT = '0xE329540c1C02a2f4368516332dCEa15531Fc0A93';

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

export const VerifySig = async (msg, sig, address) => {
    var web3 = new Web3(new Web3.providers.HttpProvider(MUMBAIENDPOINT));
    
    // verify msg content
    

    // verify sig
    var msg = web3.utils.utf8ToHex(msg);
    var r = sig.signature.slice(0, 66);
    var s = '0x' + sig.signature.slice(66, 130);
    var v = '0x' + sig.signature.slice(130, 132);
    return web3.eth.accounts.recover(msg, v, r ,s) === address;
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
