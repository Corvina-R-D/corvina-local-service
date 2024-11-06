import axios from 'axios';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import * as keytar from 'keytar';
import * as os from 'os';
import * as qs from 'qs';
import * as url from 'url';
import * as envVariables from '../../../env-variables.json';
import { loginStatus } from './common';

const { realm, baseUrl, clientId, wellKnown } = envVariables;


interface IWellKnownUris {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
}

interface IOrganization {
  name: string;
  id: number;
  label: string;
  resourceId: string;
  hostname: string;
}

const wellKnownUriMap = new Map<string, IWellKnownUris>();

export const redirectUri = 'http://localhost/callback/';
export const selectOrgRedirectUri = 'http://localhost/selectOrgCallback/';

const keytarService = 'electron-openid-oauth';
const keytarAccount = os.userInfo().username;

let accessToken: any = null;
let accessTokenExpiration: number = 0;
let profile: any = null;

/** Maps from numeric organization id to string organization id  */
let orgIdCache = new Map<number, string>();

export function getOrgResourceId(orgId: number) {
  return orgIdCache.get(orgId);
}

const saveAccessToken = (token: string) => {
  const decoded = jwtDecode(token) as JwtPayload;
  accessTokenExpiration = <number>decoded.exp * 1000 - 60000;
  accessToken = token;
};

export async function logout() {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  profile = null;

  loginStatus.loggedIn = false;
  loginStatus.username = '';
  loginStatus.organization = '';
  loginStatus.orgResourceId = '';
  loginStatus.lastError = '';
  loginStatus.organizationId = null;
  loginStatus.hostname = '';
}

export function getProfile(): any {
  return profile;
}

export async function getUris(r: string = realm): Promise<IWellKnownUris> {
  const wellKnownKey = wellKnown.replace('REALM', r);
  let wellKnownUris: IWellKnownUris | undefined = wellKnownUriMap.get(wellKnownKey);
  if (!wellKnownUris) {
    wellKnownUris = (await axios.get(wellKnownKey)).data;
    wellKnownUriMap.set(wellKnownKey, <IWellKnownUris>wellKnownUris);
  }
  return <IWellKnownUris>wellKnownUris;
}

export async function getAuthenticationURL(orgScope?: string) {
  return `${(await getUris()).authorization_endpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&response_mode=fragment&response_type=code&scope=openid${orgScope ? " org:" + orgScope :  " org:*"}`;
}

export function getLoginSelectionUrl() {
  return `${baseUrl}/#/organization?redirectTo=${selectOrgRedirectUri}`;
}

export class OrganizationSelectionRequiredException extends Error {};

const fillStatusFromToken = async (token: string, loginOrg?: string) => {
  profile = jwtDecode(token);
  loginStatus.username = profile.preferred_username;
  loginStatus.instanceId = (await axios.get(`${baseUrl}/svc/core/api/v1/instance  `, { headers: { Authorization: `Bearer ${token}` } })).data.id;

  const userOrganizations = await axios.get(`${baseUrl}/svc/core/api/v1/organizations/mine`, { headers: { Authorization: `Bearer ${token}` } });

  // populate orgIdCache
  userOrganizations.data.forEach((org: IOrganization) => {
    orgIdCache.set(org.id, org.resourceId);
  });

  if (userOrganizations.data.length > 1 && loginOrg == undefined) {
    throw new OrganizationSelectionRequiredException;
  }
  const firstOrganization: IOrganization = userOrganizations.data
    .filter((a: { resourceId: string, id: string }) => !loginOrg || a.resourceId === loginOrg || a.id.toString() === loginOrg)
    .sort((a: { resourceId: string }, b: { resourceId: string }) => a.resourceId.localeCompare(b.resourceId))[0];
  loginStatus.organization = firstOrganization.label;
  loginStatus.orgResourceId = firstOrganization.resourceId;
  loginStatus.organizationId = firstOrganization.id.toString();
  loginStatus.hostname = firstOrganization.hostname;

};


export async function refreshTokens() {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);
  if (!refreshToken) {
    console.error("No token saved for refresh!")
    return;
  }

  const loginOrg = (jwtDecode(refreshToken) as any).scope.split('org:')[1].split(' ')[0];
  const tokenEndpoint = (await getUris()).token_endpoint;

  const refreshOptions = {
    method: 'POST',
    url: tokenEndpoint,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  };

  try {
    const response = await axios(refreshOptions);

    console.log("Token refreshed!");
    saveAccessToken(response.data.access_token);
    if (response.data.refresh_token) {
      await keytar.setPassword(keytarService, keytarAccount, response.data.refresh_token);
    }

    // request rpt token
    await fillStatusFromToken(accessToken, loginOrg);

    loginStatus.loggedIn = true;
    loginStatus.lastError = '';
  } catch (error) {
    await logout();
    loginStatus.lastError = (error as any).toString();
  }
}

export async function loadTokens(callbackURL: string) {
  const urlParts = url.parse(callbackURL.replace('#', '?'), true);
  const { query } = urlParts;
  const tokenEndpoint = (await getUris()).token_endpoint;

  const exchangeOptions = {
    grant_type: 'authorization_code',
    client_id: clientId,
    code: query.code,
    redirect_uri: redirectUri,
  };

  const options = {
    method: 'POST',
    url: tokenEndpoint,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify(exchangeOptions),
  };

  try {
    const response = await axios(options);
    saveAccessToken(response.data.access_token);
    if (response.data.refresh_token) {
      await keytar.setPassword(keytarService, keytarAccount, response.data.refresh_token);
    }

    // try to decode token and extract login org
    let loginOrg = undefined;
    try {
      const permissions = JSON.parse( Buffer.from(response.data.access_token.split(".")[1], 'base64').toString() ).authorization.permissions;
      if (permissions.length == 1) {
        loginOrg = permissions[0].rsname;
        console.log("Selected organization: ", loginOrg);
      }
    } catch (error) {
      console.warn('Cannot extract a valid login org from current token', error);
    }

    await loadOrgToken(loginOrg);

    // start the timer to keep the token refreshed
    getAccessToken();
  } catch (error) {
    if (!(error instanceof OrganizationSelectionRequiredException)) {
      await logout();

      loginStatus.lastError = <string>error;
    }
    // need to select an organization first.. keep waiting

    throw error;
  }
}

function tokenToString(accessToken: string) : string {
  try {
    return JSON.parse( Buffer.from(accessToken.split(".")[1], 'base64').toString() );
  } catch(err) {}
  return '';
}

export async function loadOrgToken(selectedOrganization?: string) {
  try {
    await fillStatusFromToken(accessToken, selectedOrganization);

    loginStatus.loggedIn = true;
    loginStatus.lastError = '';
    console.log("Successfully loaded token!");// tokenToString(accessToken));
  } catch (error) {
    if (!(error instanceof OrganizationSelectionRequiredException)) {
      await logout();

      loginStatus.lastError = <string>error;
    }
    // need to select an organization first.. keep waiting

    throw error;
  }
}

export async function getLogOutUrl() {
  return (await getUris()).end_session_endpoint;
}


let refreshInterval : NodeJS.Timer | null = null;

export async function getAccessToken(): Promise<any> {
  if (refreshInterval == undefined) {
    // ensure the token is kept refreshed while logged ins
    refreshInterval = setInterval(async () => {
        if (loginStatus.loggedIn) {
          try {
            await getAccessToken();
          } catch (error) {
            console.warn('Error refreshing token!', error);
          }
        }
    }, 1000 * 30);
  }
  if (Date.now() >= accessTokenExpiration) {
    await refreshTokens();
  }
  return accessToken;
}


