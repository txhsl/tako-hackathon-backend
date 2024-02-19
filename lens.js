import { LensClient, production } from '@lens-protocol/client';
import fetch from 'node-fetch';

const ENV = production;
const PREFIX = 'lens/';
const LENSAPI = 'https://api-v2.lens.dev';

export const GetLensFollowerAmountByHandle = async (handle) => {
    var lensClient = new LensClient({
        environment: ENV,
    });

    var profile = await lensClient.profile.fetch({
        forHandle: PREFIX + handle,
    });

    return profile.stats.followers;
};

const GetDefaultProfileFollowersGQL = (address) => {
    return `
        query GetDefaultProfile {
            defaultProfile(request: {for: "` + address + `" }) {
                stats {
                    followers
                }
            }
        }
    `;
};

const GetDefaultProfileMetadataGQL = (address) => {
    return `
        query GetDefaultProfile {
            defaultProfile(request: {for: "` + address + `" }) {
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

export const GetLensFollowerAmountByAddress = async (address) => {
    var query = GetDefaultProfileFollowersGQL(address);
    var res = await fetch(LENSAPI, {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    var data = JSON.parse(await res.text()).data;
    if (data.defaultProfile == null) {
        return 0;
    }
    return data.defaultProfile.stats.followers;
};

export const GetLensProfileMetadataByAddress = async (address) => {
    var query = GetDefaultProfileMetadataGQL(address);
    var res = await fetch(LENSAPI, {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    var data = JSON.parse(await res.text()).data;
    if (data.defaultProfile == null) {
        return null;
    }
    return data.defaultProfile.metadata;
};
