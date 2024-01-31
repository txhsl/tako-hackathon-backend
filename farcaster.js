import Web3 from 'web3';
import fs from 'fs';
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const OPENDPOINT = 'https://opt-mainnet.g.alchemy.com/v2/D42sQ94oVuspIH75fc7udztb_lNecP6b';
const FARCASTERAPI = 'nemes.farcaster.xyz:2283';
const CONTRACT = '0x00000000Fc6c5F01Fc30151999387Bb99A9f489b';

export const GetFarcasterFollowerAmountByAddress = async(address) => {
    // get fid
    var web3 = new Web3(new Web3.providers.HttpProvider(OPENDPOINT));
    var abi = JSON.parse(fs.readFileSync('public/IdRegistry.json'));
    var registry = new web3.eth.Contract(abi, CONTRACT);
    var fid = await registry.methods.idOf(address).call();
    if (fid == 0) {
        return 0;
    }

    // get followers
    var client = getSSLHubRpcClient(FARCASTERAPI)
    var p = new Promise((resolve) => {
        client.$.waitForReady(Date.now() + 5000, async(e) => {
            if (e) {
                return 0;
            } else {
                var links = await client.getLinksByTarget({
                    targetFid: fid,
                    linkType: 'follow',
                });
                resolve(links.value.messages.length);
            }
        });
    })
    
    return await p;
};
