import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GetFarcasterFollowerAmountByAddress } from './farcaster.js';
import { GetFriendTechProfileByAddress, GetFriendTechTradeActivitiesByAddress } from './friend-tech.js';
import { GetLensProfileInfoByAddress } from './lens.js';
import { SignForEvaluate, GetOverdueFactor } from './vault.js';

const app = express();

// app.use('/public', express.static('./public'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.send('Evaluator is working.');
});

app.get('/stats/:address', async function(req, res) {
    var address = req.params.address;
    var fcFollowerAmount = GetFarcasterFollowerAmountByAddress(address);
    var ftProfile = GetFriendTechProfileByAddress(address);
    var lProfile = GetLensProfileInfoByAddress(address);
    var factor = GetOverdueFactor(address);

    var profile = await lProfile;
    if (profile == null) {
        res.json({
            handle: null,
            name: null,
            bio: null,
            pic: null,
            cover: null,
            holders: 0,
            holdings: 0,
            credit: 0,
        });
        return;
    }

    var handle = profile.handle.localName;
    var metadata = profile.metadata;
    var pic = null;
    var cover = null;
    if (metadata.picture != null) {
        pic = metadata.picture.optimized.uri;
    }
    if (metadata.coverPicture != null) {
        cover = metadata.coverPicture.optimized.uri;
    }

    var stats = await ftProfile;
    if (stats == null) {
        res.json({
            handle: handle,
            name: metadata.displayName,
            bio: metadata.bio,
            pic: pic,
            cover: cover,
            holders: 0,
            holdings: 0,
            credit: Math.log2(await fcFollowerAmount + 0 + profile.stats.followers) * Math.pow(0.9, await factor),
        });
        return;
    }
    
    res.json({
        handle: handle,
        name: metadata.displayName,
        bio: metadata.bio,
        pic: pic,
        cover: cover,
        holders: stats.holderCount,
        holdings: stats.holdingCount,
        credit: Math.log2(await fcFollowerAmount + stats.holderCount + profile.stats.followers) * Math.pow(0.9, await factor),
    });
});

app.get('/trades/:address', async function(req, res) {
    var address = req.params.address;
    res.json(await GetFriendTechTradeActivitiesByAddress(address));
});

app.get('/evaluate/:address', async function(req, res) {
    var address = req.params.address;
    var fcFollowerAmount = GetFarcasterFollowerAmountByAddress(address);
    var ftProfile = GetFriendTechProfileByAddress(address);
    var lProfile = GetLensProfileInfoByAddress(address);
    var factor = GetOverdueFactor(address);

    var credit = 0;
    var profile = await lProfile;
    if (profile != null) {
        var a = await fcFollowerAmount;
        var b = profile.stats.followers;
        var c = 0;
        var stats = await ftProfile;
        if (stats != null) {
            c = stats.holderCount;
        }
        credit = Math.log2(a + b + c) * Math.pow(0.9, await factor);
    }
     
    var sig = SignForEvaluate(address, credit);
    res.json({
        message: {
            borrower: address,
            rank: credit,
        },
        signature: sig,
    });
});

const server = app.listen(8080);