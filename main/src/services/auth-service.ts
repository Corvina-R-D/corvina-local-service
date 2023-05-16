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

export async function getAuthenticationURL() {
  return `${(await getUris()).authorization_endpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&response_mode=fragment&response_type=code&scope=openid`;
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

const exchangeRptToken = async (token: string) => {
  const tokenEndpoint = (await getUris()).token_endpoint;
  // request rpt token
  const rptResponse = await axios({
    method: 'POST',
    url: tokenEndpoint,
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
      audience: 'corvina-platform',
      permission: loginStatus.orgResourceId,
    }),
  });

  saveAccessToken(rptResponse.data.access_token);
  await keytar.setPassword(keytarService, keytarAccount, rptResponse.data.refresh_token);
};

export async function refreshTokens() {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);
  if (!refreshToken) {
    return;
  }

  const loginOrg = (jwtDecode(refreshToken) as any).authorization.permissions[0].rsname;
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

    saveAccessToken(response.data.access_token);

    // request rpt token
    await fillStatusFromToken(accessToken, loginOrg);

    await exchangeRptToken(accessToken);

    loginStatus.loggedIn = true;
    loginStatus.lastError = '';
  } catch (error) {
    await logout();
    loginStatus.lastError = <string>error;

    throw error;
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

    await loadRptToken();
  } catch (error) {
    if (!(error instanceof OrganizationSelectionRequiredException)) {
      await logout();

      loginStatus.lastError = <string>error;
    }

    throw error;
  }
}

export async function loadRptToken(selectedOrganization?: string) {
  try {
    await fillStatusFromToken(accessToken, selectedOrganization);
    // request rpt token
    await exchangeRptToken(accessToken);

    loginStatus.loggedIn = true;
    loginStatus.lastError = '';
  } catch (error) {
    if (!(error instanceof OrganizationSelectionRequiredException)) {
      await logout();

      loginStatus.lastError = <string>error;
    }

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


