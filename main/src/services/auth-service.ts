import axios from 'axios';
import * as crypto from 'crypto';
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

// PKCE (RFC 7636): this is a public client, so the authorization code is bound
// to a one-time verifier that only this process knows.
let pkceVerifier: string | null = null;

export async function getAuthenticationURL(orgScope?: string) {
  pkceVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(pkceVerifier).digest('base64url');
  return `${(await getUris()).authorization_endpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&response_mode=fragment&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=openid${orgScope ? " org:" + orgScope :  " org:*"}`;
}

/** Organizations of the logged-in user, as returned by the last status refresh. */
let userOrganizationsCache: IOrganization[] = [];

const escapeHtml = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Local organization selection page. The Corvina portal page cannot be used
 * here: it logs in with its own client (corvina-web-portal), which rejects the
 * localhost redirect. Each entry navigates to selectOrgRedirectUri, which the
 * login window intercepts to restart the login with "org:<resourceId>" using
 * this application's client.
 */
export function getLoginSelectionUrl() {
  const items = [...userOrganizationsCache]
    .sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name))
    .map((org) => `<li><a href="${selectOrgRedirectUri}?org=${encodeURIComponent(org.resourceId)}">${escapeHtml(org.label || org.name)}<small>${escapeHtml(org.resourceId)}</small></a></li>`)
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Corvina - select organization</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;background:#f4f6f8;color:#2c3e50;margin:0;display:flex;justify-content:center}
main{background:#fff;margin:40px 16px;padding:24px 32px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.15);min-width:360px}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 16px;color:#607080}
ul{list-style:none;padding:0;margin:0}li{border-top:1px solid #e3e7eb}
a{display:flex;justify-content:space-between;align-items:center;padding:12px 4px;color:#2c3e50;text-decoration:none;font-size:16px}
a:hover{background:#eef3f7}small{color:#90a0b0;font-size:12px;margin-left:16px}
</style></head><body><main><h1>Select the organization</h1>
<p>${escapeHtml(profile?.preferred_username ?? '')}</p><ul>${items}</ul></main></body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

export class OrganizationSelectionRequiredException extends Error {};

/** Returns the organization granted by the token when it grants exactly one. */
function orgFromTokenPermissions(token: string): string | undefined {
  try {
    const permissions = JSON.parse(Buffer.from(token.split(".")[1], 'base64').toString()).authorization.permissions;
    if (permissions.length == 1) {
      return permissions[0].rsname;
    }
  } catch (error) {
    console.warn('Cannot extract a valid login org from current token', error);
  }
  return undefined;
}

const fillStatusFromToken = async (token: string, loginOrg?: string) => {
  profile = jwtDecode(token);
  loginStatus.username = profile.preferred_username;
  loginStatus.instanceId = (await axios.get(`${baseUrl}/svc/core/api/v1/instance  `, { headers: { Authorization: `Bearer ${token}` } })).data.id;

  const userOrganizations = await axios.get(`${baseUrl}/svc/core/api/v1/organizations/mine`, { headers: { Authorization: `Bearer ${token}` } });

  // populate orgIdCache
  userOrganizationsCache = userOrganizations.data;
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

  // Organization requested at login: "org:<resourceId>" after an explicit
  // selection, or the wildcard "org:*" when the user did not have to choose.
  const scopeOrg: string | undefined = (jwtDecode(refreshToken) as any).scope?.split('org:')[1]?.split(' ')[0];
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

    // "*" is not an organization: resolve it the same way the initial login
    // does, otherwise no organization matches and the user gets logged out.
    const loginOrg = scopeOrg && scopeOrg !== '*'
      ? scopeOrg
      : loginStatus.orgResourceId || orgFromTokenPermissions(accessToken);

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
    code_verifier: pkceVerifier,
  };
  pkceVerifier = null;

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

    // Organization explicitly requested in the scope (after a selection),
    // otherwise the one granted by the token if it is the only one.
    const scopeOrg: string | undefined = (jwtDecode(response.data.access_token) as any).scope?.split('org:')[1]?.split(' ')[0];
    const loginOrg = scopeOrg && scopeOrg !== '*'
      ? scopeOrg
      : orgFromTokenPermissions(response.data.access_token);
    if (loginOrg) {
      console.log("Selected organization: ", loginOrg);
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


