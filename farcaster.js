const TAKOAPI = 'https://api.tako.so';
const JAMFRENSAPI = 'https://api.jamfrens.so/';

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

export const GetFarcasterExplore = async () => {
    // fetch from jamfrens
    var res = await fetch(JAMFRENSAPI + '/v2/content/explore?ecosystem=farcaster', {
        method: 'GET',
    });
    var data = JSON.parse(await res.text()).data;
    return data.items;
};
