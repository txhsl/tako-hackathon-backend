import express from 'express';
import { GetFarcasterFollowerAmountByAddress } from './farcaster.js';
import { GetFriendTechKeySupplyByAddress } from './friend-tech.js';
import { GetLensFollowerAmountByAddress } from './lens.js';

const app = express();

// app.use('/public', express.static('./public'));

app.get('/', function(req, res) {
    res.send('Evaluator is working.');
})

app.get('/evaluate/:address', async function(req, res) {
    var address = req.params.address;
    var a = GetFriendTechKeySupplyByAddress(address);
    var b = GetFarcasterFollowerAmountByAddress(address);
    var c = GetLensFollowerAmountByAddress(address);

    var rank = Math.log2(await a + await b + await c);
    res.send(rank.toString());
})

const server = app.listen(8080);