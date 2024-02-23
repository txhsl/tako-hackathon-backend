import { LensClient, production, ExplorePublicationsOrderByType } from '@lens-protocol/client';
import fetch from 'node-fetch';

const ENV = production;
const PREFIX = 'lens/';
const LENSAPI = 'https://api-v2.lens.dev';

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

const GetDefaultProfileInfoGQL = (address) => {
    return `
        query GetDefaultProfile {
            defaultProfile(request: {for: "` + address + `" }) {
                handle {
                    localName
                }
                stats {
                    followers
                }
                metadata {
                    displayName
                    bio
                    picture {
                        ... on ImageSet {
                            optimized {
                                uri
                            }
                        }
                    }
                    coverPicture {
                        ... on ImageSet {
                            optimized {
                                uri
                            }
                        }
                    }
                }
            }
        }
    `;
};

export const GetLensProfileInfoByAddress = async (address) => {
    var query = GetDefaultProfileInfoGQL(address);
    var res = await fetch(LENSAPI, {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    var data = JSON.parse(await res.text()).data;
    return data.defaultProfile;
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
