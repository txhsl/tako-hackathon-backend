import { LensClient, production, ExplorePublicationsOrderByType } from '@lens-protocol/client';

const ENV = production;
const PREFIX = 'lens/';

export const GetLensProfilesByAddress = async (address) => {
    var lensClient = new LensClient({
        environment: ENV,
    });

    var profiles = await lensClient.profile.fetchAll({
        where: {
            ownedBy: [address],
        },
    });
    return profiles.items;
};

export const GetLensProfileByHandle = async (handle) => {
    var lensClient = new LensClient({
        environment: ENV,
    });

    var profile = await lensClient.profile.fetch({
        forHandle: PREFIX + handle,
    });

    return profile;
};

export const GetLensProfileById = async (profileId) => {
    var lensClient = new LensClient({
        environment: ENV,
    });

    var profile = await lensClient.profile.fetch({
        forProfileId: profileId,
    });

    return profile;
};

export const GetLensFollowersById = async (profileId) => {
    var lensClient = new LensClient({
        environment: ENV,
    });

    var followers = await lensClient.profile.followers({
        of: profileId,
    });

    return followers.items;
};

export const GetLensFollowingById = async (profileId) => {
    var lensClient = new LensClient({
        environment: ENV,
    });

    var following = await lensClient.profile.following({
        for: profileId,
    });

    return following.items;
};

export const GetLensExplore = async () => {
    var lensClient = new LensClient({
        environment: ENV,
    });

    var posts = await lensClient.explore.publications({
        orderBy: ExplorePublicationsOrderByType.Latest,
    });

    return posts.items;
};
