import express from 'express';
import bodyParser from 'body-parser';
import { GetFarcasterFollowerAmountByAddress } from './farcaster.js';
import { GetFriendTechHolderAmountByAddress, GetFriendTechKeySupplyByAddress } from './friend-tech.js';
import { GetLensFollowerAmountByAddress } from './lens.js';

const app = express();

// app.use('/public', express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.send('Evaluator is working.');
});

app.get('/stats/:address', async function(req, res) {
    var address = req.params.address;
    var ftSupply = GetFriendTechKeySupplyByAddress(address);
    var ftHolderAmount = GetFriendTechHolderAmountByAddress(address);
    var fcFollowerAmount = GetFarcasterFollowerAmountByAddress(address);
    var lFollowerAmount = GetLensFollowerAmountByAddress(address);

    res.json({
        friend_tech_key_supply: await ftSupply,
        friend_tech_holder_amount: await ftHolderAmount,
        farcaster_follower_amount: await fcFollowerAmount,
        lens_follower_amount: await lFollowerAmount,
    });
});

app.get('/evaluate/:address', async function(req, res) {
    var address = req.params.address;
    var a = GetFriendTechHolderAmountByAddress(address);
    var b = GetFarcasterFollowerAmountByAddress(address);
    var c = GetLensFollowerAmountByAddress(address);

    var rank = Math.log2(await a + await b + await c);
    res.send(rank.toString());
});

app.post('/borrow', async function(req, res) {
    var amount = req.body.amount;
    var msg = req.body.msg;
    var sig = req.body.sig;

    
});

const server = app.listen(8080);