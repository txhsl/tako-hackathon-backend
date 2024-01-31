import { LensClient, development } from '@lens-protocol/client';
import fetch from 'node-fetch';

const ENV = development;
const PREFIX = 'test/';
const LENSAPI = 'https://api-v2-mumbai-live.lens.dev';

export const GetLensFollowerAmountByHandle = async (handle) => {
  var lensClient = new LensClient({
    environment: ENV,
  });

  var profile = await lensClient.profile.fetch({
    forHandle: PREFIX + handle,
  });

  return profile.stats.followers;
};

const GetDefaultProfileGQL = (address) => {
  return `
    query GetDefaultProfile {
      defaultProfile(request: {for: "` + address + `" }) {
        stats {
          followers
        }
      }
    }
  `
};

export const GetLensFollowerAmountByAddress = async (address) => {
  var query = GetDefaultProfileGQL(address);
  var res = await fetch(LENSAPI, {
    method: 'POST',
    body: JSON.stringify({query}),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  var data = JSON.parse(await res.text()).data;
  if (data.defaultProfile == null) {
    return 0;
  }
  return data.defaultProfile.stats.followers;
};
