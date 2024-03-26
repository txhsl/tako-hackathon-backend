import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { expressjwt } from 'express-jwt';
import { signKey, setToken, verToken } from './token.js';

import { GetFarcasterExplore, GetFarcasterFollowersById, GetFarcasterFollowingById, GetFarcasterIdByAddress, GetFarcasterProfileById } from './farcaster.js';
import { GetFriendTechHoldersByAddress, GetFriendTechHoldingsByAddress, GetFriendTechProfileByAddress, GetFriendTechTradeActivitiesByAddress } from './friend-tech.js';
import { GetLensExplore, GetLensFollowersById, GetLensFollowingById, GetLensProfileById, GetLensProfilesByAddress } from './lens.js';
import { SignForEvaluate, GetOverdueFactor } from './vault.js';
import { AddBindings, ChangeDisplay, CheckDuplication, ConnectDB, GetBindings, RecoverPersonalSig, LoginMsg, LensBindMsg, FcBindMsg, FtBindMsg } from './binding.js';

await ConnectDB();
const app = express();

app.use(cors({
    origin: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    var token = req.headers['authorization'];
    if (token == undefined) {
        return next();
    } else {
        verToken(token).then((info) => {
            req.address = info.address;
            return next();
        }).catch((err) => {
            res.sendStatus(401);
        });
    }
});
app.use(expressjwt({
    algorithms: ['HS256'],
    secret: signKey,
}).unless({
    path: [
        '/',
        /^\/loginmsg\//,
        /^\/login\//,
        /^\/bindmsg/,
        /^\/binding/,
        /^\/query/,
        /^\/stats/,
        /^\/explore/,
        /^\/following/,
        /^\/followers/,
        /^\/evaluate/,
    ]
}));

app.get('/', function (req, res) {
    res.send('Evaluator is working.');
});

app.get('/loginmsg/:address', async function (req, res) {
    var address = req.params.address;

    res.json({ msg: LoginMsg.replace('{id}', address) });
});

app.post('/login/:address', async function (req, res) {
    var address = req.params.address;
    var sig = req.body.sig;

    var msg = LoginMsg.replace('{id}', address);
    var signer = RecoverPersonalSig(msg, sig);
    if (signer != address.toLowerCase()) {
        res.status(401).json('invalid sig');
        return;
    }

    setToken(address).then((data) => {
        res.json({
            token: data,
        });
    });
});

app.get('/bindmsg/:type/:id', async function (req, res) {
    var type = req.params.type;
    var id = req.params.id;

    if (type != 'lensId' && type != 'farcasterId' && type != 'friendtechAddr') {
        res.sendStatus(400);
        return;
    }

    switch (type) {
        case 'lensId':
            res.json({ msg: LensBindMsg.replace('{id}', id) });
            return;
        case 'farcasterId':
            res.json({ msg: FcBindMsg.replace('{id}', id) });
            return;
        case 'friendtechAddr':
            res.json({ msg: FtBindMsg.replace('{id}', id) });
            return;
        default:
            res.json({ msg: '' });
            return;
    }
});

app.get('/binding/:address', async function (req, res) {
    var address = req.params.address;
    var bindings = await GetBindings(address);
    if (bindings == null) {
        res.json({
            lens: null,
            farcaster: null,
            friendtech: null,
            credit: 0,
        });
        return;
    }

    // fetch stats
    var fcProfile = bindings.farcasterId == null ? new Promise((resolve) => { resolve(null); }) : GetFarcasterProfileById(bindings.farcasterId);
    var ftProfile = bindings.friendtechAddr == null ? new Promise((resolve) => { resolve(null); }) : GetFriendTechProfileByAddress(bindings.friendtechAddr);
    var lProfile = bindings.lensId == null ? new Promise((resolve) => { resolve(null); }) : GetLensProfileById(bindings.lensId);
    var factor = GetOverdueFactor(address);

    // return with credits
    res.json({
        lens: bindings.lensId,
        farcaster: bindings.farcasterId,
        friendtech: bindings.friendtechAddr,
        credit: Math.log2(bindings.farcasterId == null ? 0 : (await fcProfile).followerCount
            + bindings.friendtechAddr == null ? 0 : (await ftProfile).holderCount
                + bindings.lensId == null ? 0 : (await lProfile).stats.followers
        ) * Math.pow(0.9, await factor) + 100 + bindings.farcasterId == null ? 0 : 100 + bindings.friendtechAddr == null ? 0 : 100 + bindings.lensId == null ? 0 : 100,
    });
});

app.post('/bind/', async function (req, res) {
    var type = req.body.type;
    var id = req.body.id;
    var sig = req.body.sig;
    var address = req.address;

    if (type != 'lensId' && type != 'farcasterId' && type != 'friendtechAddr') {
        res.sendStatus(400);
        return;
    }

    // verify authority
    switch (type) {
        case 'lensId':
            var msg = LensBindMsg.replace('{id}', id);
            var signer = RecoverPersonalSig(msg, sig);
            if (signer != '0xc62794420B9bFC5386C966226ddbD4246f78D016'.toLowerCase()) {
                res.status(401).json('invalid sig');
                return;
            }
            // var lProfile = await GetLensProfileById(id);
            // if (lProfile == null || lProfile.ownedBy.address.toLowerCase() != signer) {
            //     res.status(401).json('invalid sig');
            //     return;
            // }
            break;
        case 'farcasterId':
            var msg = FcBindMsg.replace('{id}', id);
            var signer = RecoverPersonalSig(msg, sig);
            if (signer != '0xc62794420B9bFC5386C966226ddbD4246f78D016'.toLowerCase()) {
                res.status(401).json('invalid sig');
                return;
            }
            // var fcProfile = await GetFarcasterProfileById(id);
            // if (fcProfile == null || fcProfile.extras.custodyAddress.toLowerCase() != signer) {
            //     res.status(401).json('invalid sig');
            //     return;
            // }
            break;
        case 'friendtechAddr':
            var msg = FtBindMsg.replace('{id}', id);
            var signer = RecoverPersonalSig(msg, sig);
            if (signer != '0xc62794420B9bFC5386C966226ddbD4246f78D016'.toLowerCase()) {
                res.status(401).json('invalid sig');
                return;
            }
            // var ftProfile = await GetFriendTechProfileByAddress(id);
            // if (ftProfile == null || ftProfile.address.toLowerCase() != signer) {
            //     res.status(401).json('invalid sig');
            //     return;
            // }
            break;
        default:
            break;
    }

    // check existence
    var bindings = await GetBindings(address);
    if (bindings != null && bindings[type]) {
        res.status(500).json('binding exists');
        return;
    }

    // check duplication
    if (await CheckDuplication(type, id)) {
        res.status(500).json('binding used');
        return;
    }

    // update database
    await AddBindings(address, type, id);

    // return success
    res.sendStatus(200);
});

app.get('/query/:domain/:address', async function (req, res) {
    var domain = req.params.domain;
    var address = req.params.address;

    if (domain != 'lens' && domain != 'farcaster' && domain != 'friendtech') {
        res.sendStatus(400);
        return;
    }

    switch (domain) {
        case 'lens':
            var handles = await GetLensProfilesByAddress(address);
            res.json(handles);
            return;
        case 'farcaster':
            var fid = await GetFarcasterIdByAddress(address);
            if (fid != 0) {
                res.json(await GetFarcasterProfileById(fid));
            } else {
                res.json({});
            }
            return;
        case 'friendtech':
            res.json(await GetFriendTechProfileByAddress(address));
            return;
        default:
            break;
    }
});

app.get('/stats/:address', async function (req, res) {
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
    var fcProfile = bindings.farcasterId == null ? new Promise((resolve) => { resolve(null); }) : GetFarcasterProfileById(bindings.farcasterId);
    var ftProfile = bindings.friendtechAddr == null ? new Promise((resolve) => { resolve(null); }) : GetFriendTechProfileByAddress(bindings.friendtechAddr);
    var lProfile = bindings.lensId == null ? new Promise((resolve) => { resolve(null); }) : GetLensProfileById(bindings.lensId);
    var factor = GetOverdueFactor(address);

    // return for display
    res.json({
        lens: await lProfile,
        farcaster: await fcProfile,
        friendtech: await ftProfile,
        credit: Math.log2(bindings.farcasterId == null ? 0 : (await fcProfile).followerCount
            + bindings.friendtechAddr == null ? 0 : (await ftProfile).holderCount
                + bindings.lensId == null ? 0 : (await lProfile).stats.followers
        ) * Math.pow(0.9, await factor) + 100 + bindings.farcasterId == null ? 0 : 100 + bindings.friendtechAddr == null ? 0 : 100 + bindings.lensId == null ? 0 : 100,
        display: bindings.display == null ? null : bindings.display
    });
});

app.post('/display/:address', async function (req, res) {
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

app.get('/explore/:domain/:address', async function (req, res) {
    var address = req.params.address;
    var domain = req.params.domain;

    if (domain != 'lens' && domain != 'farcaster' && domain != 'friendtech') {
        res.sendStatus(400);
        return;
    }

    // read bindings from database
    var bindings = await GetBindings(address);
    if (bindings == null) {
        res.json([]);
        return;
    }

    // return trade activities
    if (domain == 'friendtech') {
        res.json(await GetFriendTechTradeActivitiesByAddress(bindings.friendtechAddr));
    } else if (domain == 'lens') {
        res.json(await GetLensExplore());
    } else if (domain == 'farcaster') {
        res.json(await GetFarcasterExplore());
    }
});

app.get('/following/:domain/:address', async function (req, res) {
    var address = req.params.address;
    var domain = req.params.domain;

    if (domain != 'lens' && domain != 'farcaster' && domain != 'friendtech') {
        res.sendStatus(400);
        return;
    }

    // read bindings from database
    var bindings = await GetBindings(address);
    if (bindings == null) {
        res.json([]);
        return;
    }

    // return trade activities
    if (domain == 'friendtech') {
        res.json(await GetFriendTechHoldingsByAddress(bindings.friendtechAddr));
    } else if (domain == 'lens') {
        res.json(await GetLensFollowingById(bindings.lensId));
    } else if (domain == 'farcaster') {
        res.json(await GetFarcasterFollowingById(bindings.farcasterId));
    }
});

app.get('/followers/:domain/:address', async function (req, res) {
    var address = req.params.address;
    var domain = req.params.domain;

    if (domain != 'lens' && domain != 'farcaster' && domain != 'friendtech') {
        res.sendStatus(400);
        return;
    }

    // read bindings from database
    var bindings = await GetBindings(address);
    if (bindings == null) {
        res.json([]);
        return;
    }

    // return trade activities
    if (domain == 'friendtech') {
        res.json(await GetFriendTechHoldersByAddress(bindings.friendtechAddr));
    } else if (domain == 'lens') {
        res.json(await GetLensFollowersById(bindings.lensId));
    } else if (domain == 'farcaster') {
        res.json(await GetFarcasterFollowersById(bindings.farcasterId));
    }
});

app.get('/evaluate/:address', async function (req, res) {
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
    var fcProfile = bindings.farcasterId == null ? new Promise((resolve) => { resolve(null); }) : GetFarcasterProfileById(bindings.farcasterId);
    var ftProfile = bindings.friendtechAddr == null ? new Promise((resolve) => { resolve(null); }) : GetFriendTechProfileByAddress(bindings.friendtechAddr);
    var lProfile = bindings.lensId == null ? new Promise((resolve) => { resolve(null); }) : GetLensProfileById(bindings.lensId);
    var factor = GetOverdueFactor(address);

    // calculate credit
    var credit = Math.log2(bindings.farcasterId == null ? 0 : (await fcProfile).followerCount
        + bindings.friendtechAddr == null ? 0 : (await ftProfile).holderCount
            + bindings.lensId == null ? 0 : (await lProfile).stats.followers
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