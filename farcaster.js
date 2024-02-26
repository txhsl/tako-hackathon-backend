const WARPCASTAPI = 'https://client.warpcast.com';
const TAKOAPI = 'https://api.tako.so';
const JAMFRENSAPI = 'https://api.jamfrens.so';

export const GetFarcasterProfileById = async (fid) => {
    // fetch from tako
    var res = await fetch(TAKOAPI + '/token/profile/v1/portfolio/view', {
        method: 'POST',
        body: JSON.stringify({
            "ecosystem": "farcaster",
            "profile_id": fid
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    var data = JSON.parse(await res.text()).data;
    return data.profile;
};

export const GetFarcasterFollowersById = async (fid) => {
    // fetch from warpcast
    var res = await fetch(WARPCASTAPI + '/v2/followers?fid=' + fid, {
        method: 'GET',
    });
    var data = JSON.parse(await res.text());
    return data.result.users;
};

export const GetFarcasterFollowingById = async (fid) => {
    // fetch from warpcast
    var res = await fetch(WARPCASTAPI + '/v2/following?fid=' + fid, {
        method: 'GET',
    });
    var data = JSON.parse(await res.text());
    return data.result.users;
};

export const GetFarcasterExplore = async () => {
    // fetch from jamfrens
    var res = await fetch(JAMFRENSAPI + '/v2/content/explore?ecosystem=farcaster', {
        method: 'GET',
    });
    var data = JSON.parse(await res.text()).data;
    return data.items;
};
