import Web3 from 'web3';
import fs from 'fs';

const BASEENDPOINT = 'https://base-mainnet.g.alchemy.com/v2/ZcordjkJcxhfFvwFdLgR1yQHLppJZOna';
const FRIENDTECHAPI = 'https://prod-api.kosetto.com';
const CONTRACT = '0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4';

export const GetFriendTechKeySupplyByAddress = async (address) => {
    // get share supply
    var web3 = new Web3(new Web3.providers.HttpProvider(BASEENDPOINT));
    var abi = JSON.parse(fs.readFileSync('public/FriendtechSharesV1.json'));
    var friendTech = new web3.eth.Contract(abi, CONTRACT);
    var sharesSupply = await friendTech.methods.sharesSupply(address).call();
    return Number(sharesSupply);
};

export const GetFriendTechKeyPriceByAddress = async (address) => {
    // get buy price
    var web3 = new Web3(new Web3.providers.HttpProvider(BASEENDPOINT));
    var abi = JSON.parse(fs.readFileSync('public/FriendtechSharesV1.json'));
    var friendTech = new web3.eth.Contract(abi, CONTRACT);
    var buyPrice = await friendTech.methods.getBuyPrice(address, 1).call();
    return Number(buyPrice);
};

export const GetFriendTechProfileByAddress = async (address) => {
    var res = await fetch(FRIENDTECHAPI + '/users/' + address, {
        method: 'GET',
    });
    var data = JSON.parse(await res.text());
    if (data.holderCount == null) {
        return null;
    }
    return data;
};

export const GetFriendTechTradeActivitiesByAddress = async (address) => {
    // get holder amount
    var res = await fetch(FRIENDTECHAPI + '/friends-activity/' + address, {
        method: 'GET',
    });
    var data = JSON.parse(await res.text());
    if (data.events == null) {
        return null;
    }
    return data.events;
};
