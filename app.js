import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GetFarcasterProfileById } from './farcaster.js';
import { GetFriendTechProfileByAddress, GetFriendTechTradeActivitiesByAddress } from './friend-tech.js';
import { GetLensProfileByHandle } from './lens.js';
import { SignForEvaluate, GetOverdueFactor } from './vault.js';
import { AddBindings, ChangeDisplay, CheckDuplication, ConnectDB, GetBindings, RecoverBindingSig, RecoverChangeDisplaySig } from './binding.js';

await ConnectDB();
const app = express();

// app.use('/public', express.static('./public'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.send('Evaluator is working.');
});

app.post('/bind/:address', async function(req, res) {
    var address = req.params.address;
    var type = req.body.type;
    var id = req.body.id;
    var sig = req.body.sig;

    if (type != 'lensHandle' && type != 'farcasterId' && type != 'friendtechAddr') {
        res.sendStatus(400);
        return;
    }

    // verify authority
    var signer = RecoverBindingSig(address, type, id, sig);
    if (type == 'lensHandle') {
        var lProfile = await GetLensProfileByHandle(id);
        if (lProfile == null || lProfile.ownedBy.address.toLowerCase() != signer) {
            res.status(401).json('invalid sig');
            return;
        }
    } else if (type == 'friendtechAddr') {
        var ftProfile = await GetFriendTechProfileByAddress(id);
        if (ftProfile == null || ftProfile.address.toLowerCase() != signer) {
            res.status(401).json('invalid sig');
            return;
        }
    } else if (type == 'farcasterId') {
        var fcProfile = await GetFarcasterProfileById(id);
        if (fcProfile == null || fcProfile.extras.custodyAddress.toLowerCase() != signer) {
            res.status(401).json('invalid sig');
            return;
        }
    }

    // check existence
    var bindings = await GetBindings(address);
    if (bindings != null && bindings[type]) {
        res.status(500).json('binding exists');
        return;
    }
    
    // check duplication
    if (await CheckDuplication(type, id)) {
        res.sendStatus(500).json('binding used');
        return;
    }

    // update database
    await AddBindings(address, type, id); 

    // return success
    res.sendStatus(200);
});

app.get('/stats/:address', async function(req, res) {
    var address = req.params.address;

    // read bindings from database
    var bindings = await GetBindings(address);
    if (bindings == null) {
        res.json({
            lens: null,
            farcaster: null,
            friendtech: null,
            credit: 0,
            display: null
        });
        return;
    }
    
    // fetch stats
    var fcProfile = bindings.farcasterId == null ? new Promise((resolve) => {resolve(null);}) : GetFarcasterProfileById(bindings.farcasterId);
    var ftProfile = bindings.friendtechAddr == null ? new Promise((resolve) => {resolve(null);}) : GetFriendTechProfileByAddress(bindings.friendtechAddr);
    var lProfile = bindings.lensHandle == null ? new Promise((resolve) => {resolve(null);}) : GetLensProfileByHandle(bindings.lensHandle);
    var factor = GetOverdueFactor(address);

    // return for display
    res.json({
        lens: await lProfile,
        farcaster: await fcProfile,
        friendtech: await ftProfile,
        credit: Math.log2(bindings.farcasterId == null ? 0 : (await fcProfile).followerCount
            + bindings.friendtechAddr == null ? 0 : (await ftProfile).holderCount
            + bindings.lensHandle == null ? 0 : (await lProfile).stats.followers
            ) * Math.pow(0.9, await factor),
        display: bindings.display == null ? null : bindings.display
    });
});

app.post('/default/:address', async function(req, res) {
    var address = req.params.address;
    var display = req.body.display;
    var sig = req.body.sig;

    if (display != 'lens' && display != 'farcaster' && display != 'friendtech') {
        res.sendStatus(400);
        return;
    }

    // verify authority
    var signer = RecoverChangeDisplaySig(display, sig);
    if (address.toLowerCase() != signer) {
        res.status(401).json('invalid sig');
        return;
    }

    // update database
    await ChangeDisplay(address, display);

    // return success
    res.sendStatus(200);
});

app.get('/trades/:address', async function(req, res) {
    var address = req.params.address;

    // read bindings from database
    var bindings = await GetBindings(address);
    if (bindings == null) {
        res.json([]);
        return;
    }

    // return trade activities
    res.json(await GetFriendTechTradeActivitiesByAddress(bindings.friendtechAddr));
});

app.get('/evaluate/:address', async function(req, res) {
    var address = req.params.address;

    // read bindings from database
    var bindings = await GetBindings(address);

    if (bindings == null) {
        res.json({
            message: {
                borrower: address,
                rank: 0,
            },
            signature: SignForEvaluate(address, 0),
        });
        return;
    }

    // fetch stats
    var fcProfile = bindings.farcasterId == null ? new Promise((resolve) => {resolve(null);}) : GetFarcasterProfileById(bindings.farcasterId);
    var ftProfile = bindings.friendtechAddr == null ? new Promise((resolve) => {resolve(null);}) : GetFriendTechProfileByAddress(bindings.friendtechAddr);
    var lProfile = bindings.lensHandle == null ? new Promise((resolve) => {resolve(null);}) : GetLensProfileByHandle(bindings.lensHandle);
    var factor = GetOverdueFactor(address);

    // calculate credit
    var credit = Math.log2(bindings.farcasterId == null ? 0 : (await fcProfile).followerCount
        + bindings.friendtechAddr == null ? 0 : (await ftProfile).holderCount
        + bindings.lensHandle == null ? 0 : (await lProfile).stats.followers
        ) * Math.pow(0.9, await factor);

    // sign message
    var sig = SignForEvaluate(address, credit);

    // return stats and signature
    res.json({
        message: {
            borrower: address,
            rank: credit,
        },
        signature: sig,
    });
});

const server = app.listen(8080);