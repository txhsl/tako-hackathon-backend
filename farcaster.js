const TAKOAPI = 'https://api.tako.so';

export const GetFarcasterProfileById = async (fid) => {
    // get followers
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
