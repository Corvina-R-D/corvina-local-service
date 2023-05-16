import axios from 'axios';
import semverDiff from 'semver/functions/diff';
import typia from 'typia';
import { baseUrl } from '../../../env-variables.json';
import * as authService from './auth-service';
import { loginStatus } from './common';
import { IVPNConnectionResult } from './vpn-service';

export interface CompanionAppInfoDTO {
  requiredProductVersion?: string;
  requiredProtocol?: string;
  appName?: string;
  appInstallBinaryName?: string;
  appInstallUrl?: string;
}

export interface Credentials {
  name: string;
  domain: string;
  password: string;
  host: string;
  loginPath: string;
  originalHost: string;
  originalLoginPath: string;
  url?: string;
}

export enum VPNAppStatus {
  UNKNOWN = 0x0,
  NOT_DETECTED = 0x1,
  DETECTED = 0x2,
  RUNNING = 0x4,
  DETECTED_AND_RUNNING = 0x2 | 0x4,
  UPDATE_AVAILABLE = 0x8, // patch version
  UPDATE_REQUIRED = 0x10, // new minor version
}

export interface VPNAppInfo {
  networkError?: boolean;
  protocolName?: string;
  libVersion?: string;
  productVersion?: string;
  hostname: string;
  port: number;
}

export enum VPNAppState {
  INVALID_STATE = -1,
  IDLE = 0,
  ERROR = 1,
  SETTING_UP = 2,
  CONNECTING = 3,
  CONNECTED = 4,
  DISCONNECTING = 5,
}

export interface VPNAppConnectionStatus {
  state: VPNAppState;
  error?: {
    code: number;
    desc: string;
    seq: number;
  };
  conn?: {
    gateway_ip: string;
    ip: string;
    start_time: number;
  };
  login?: {
    user: string;
  };
  progress?: {
    desc: string;
    step: number;
    total: number;
  };
}

// export enum VPNAppStateErrorCode {
//   NULL_ERROR = -1,
//   NO_ERROR = 0,
//   GENERIC_ERROR = 1,
//   SYSTEM_ERROR = 2,
//   NOT_CONFIGURED = 3,
//   BAD_CREDENTIAL = 10,
//   CODE_REQUEST_TIMEOUT = 20,
//   INVALID_ACTIVATION_CODE = 50,
//   ACTIVATION_CODE_NOT_REGISTERED = 51,
//   SERVICE_COULD_NOT_BE_REACHED = 100,
//   SERVER_COULD_NOT_BE_REACHED = 200,
//   SERVER_VERIFICATION_FAILED = 201,
//   SERVER_INTERNAL_ERROR = 202,
//   SERVER_REPORTED_INVALID_LICENSE = 203,
//   SERVER_REPORTED_CONTENT_NOT_FOUND = 204,
//   AUTHENTICATION_FAILED = 300,
//   USER_ALREADY_CONNECTED = 310,
//   ORGANIZATION_REQUIRED = 320,
//   PROXY_AUTHENTICATION_FAILED = 400,
//   CONFIGURATION_DOWNLOAD_FAILURE = 450,
//   BAD_CONFIGURATION_DOWNLOADED = 451,
//   VPN_CLIENT_FAILURE = 500,
//   VPN_CLIENT_TIMEOUT = 501,
//   BAD_VPN_CLIENT_CONFIGURATION = 502,
//   VPN_CLIENT_PING_EXIT = 503
// }

// export type SET_VPNAPP_UPDATE_FLAGS_Payload = {
//   updateAvailable: boolean,
//   updateRequired: boolean
// }

let monitorVpnAppStatusTimer: NodeJS.Timeout | undefined = undefined;

export let appStatus: VPNAppStatus = VPNAppStatus.UNKNOWN;
export let connectionStatus: VPNAppConnectionStatus = { state: VPNAppState.INVALID_STATE };
let port: number = 0;
let hostname: string = 'localhost';
let companionAppInfo: CompanionAppInfoDTO;

let updateAvailable: boolean = false;
let updateRequired: boolean = false;

export type CompanionAppInfoByOSDTO = { os: 'win' | 'mac' | 'lin'; info: CompanionAppInfoDTO }[];

export const clientOs : "win" | 'mac' | 'linux' | 'unknown' = (() => {
  switch (process.platform) {
    case 'win32':
      return 'win';
    case 'linux':
      return 'linux';
    case 'darwin':
      return 'mac';
    default:
      return 'unknown';
  }
})();

const MAX_RETRIES = 5;
let retryCounter: number = MAX_RETRIES;
let lastVpnState: VPNAppState = VPNAppState.INVALID_STATE;
let canceling: boolean = false;
let busy: boolean = false;

const appPollTimeout = () => {
  if (port <= 0 || port == undefined) {
    return 10000;
  } else {
    return 3000;
  }
};


const setVpnAppPort = (_port: number) => {
  port = _port;

  if (port > 0) {
    // found running
    if (!(appStatus & VPNAppStatus.RUNNING)) {
      appStatus |= VPNAppStatus.DETECTED_AND_RUNNING;
    }
  } else {
    // not found running
    // after first detection attempt switch from unknown to not detected
    if (appStatus == VPNAppStatus.UNKNOWN) {
      appStatus = VPNAppStatus.NOT_DETECTED;
    } else {
      appStatus = VPNAppStatus.UNKNOWN;
    }
  }
};


const fetchCompanionAppInfo = async () => {
  if (companionAppInfo?.appName) {
    return companionAppInfo;
  }
  const result = await axios.get(`${baseUrl}/svc/vpn2/api/v1/companionApp/info`);
  companionAppInfo = typia.assert<CompanionAppInfoByOSDTO>(result.data).filter((x) => x.os.toLowerCase() == clientOs.toLowerCase())[0].info;
};

export const startVpnAppMonitoring = async () => {
  await fetchCompanionAppInfo();
  if (monitorVpnAppStatusTimer) {
    return;
  }
  const monitorFunction = async () => {
    if (port <= 0 || port == undefined) {
      loginStatus.vpnLoggedIn = false;
      try {
        await detectApp();
        await getConnectionStatus();
      } catch (e: any) {
        console.log('Error detecting app: ', e.toString());
      }
    } else {
      // monitor app status
      try {
        await getConnectionStatus();
        retryCounter = MAX_RETRIES;
      } catch (e: any) {
        console.log('Error reading status: ', e.toString());
        retryCounter--;
        if (retryCounter <= 0) {
          retryCounter = MAX_RETRIES;
          console.log('Vpn app disconnected??', e);
          // force rediscover after error
          port = -1;
          loginStatus.vpnLoggedIn = false;
        }
      }
    }
    if (monitorVpnAppStatusTimer) {
      clearTimeout(monitorVpnAppStatusTimer);
    }
    monitorVpnAppStatusTimer = <NodeJS.Timeout>setTimeout(monitorFunction, appPollTimeout());
  };
  monitorFunction();
};

//   @Action
const stopVpnAppMonitoring = async () => {
  clearTimeout(monitorVpnAppStatusTimer);
  monitorVpnAppStatusTimer = undefined;
};

const testServiceIsRunning = async (hostname: string, port: number): Promise<VPNAppInfo | undefined> => {
  try {
    let result: any = (await axios.get(`https://${hostname}:${port}/api/v1/info`, { timeout: 1000 })).data;
    result.hostname = hostname;
    result.port = port;
    return typia.assert<VPNAppInfo>(result);
  } catch (e: any) {
    if (e?.message?.match(/Network Error/)) {
      return { hostname, port, networkError: true };
    }
  }
  return undefined;
};

const detectApp = async (): Promise<void> => {
  fetchCompanionAppInfo();
  // Is the app running? try known ports
  let START_PORT = 4804;
  let END_PORT = START_PORT + 12;
  let STEP = 6;
  let hostnames = ['127.0.0.1', 'localhost'];

  console.log('Try detecting VPN app...');
  let networkErrors = 0;

  // foreach hostnames
  for (let h of hostnames) {
    for (let p = START_PORT; p < END_PORT; p += 3) {
      let promises = [];
      for (let i = 0; i < STEP; i++) {
        promises.push(testServiceIsRunning(h, p + i));
      }

      let resolvedResult: VPNAppInfo | undefined;

      try {
        resolvedResult = await Promise.any(promises);
        if (resolvedResult?.networkError == true) {
          networkErrors++;
        }
        if (!resolvedResult) {
          throw 'Not found!';
        } else if (resolvedResult.protocolName !== companionAppInfo.requiredProtocol || !resolvedResult.productVersion) {
          throw `Invalid protocol version: ${resolvedResult.protocolName}, ${resolvedResult.productVersion}`;
        }
      } catch (e) {
        const resolved = await Promise.all(promises);
        let foundIndex = resolved.findIndex((v) => {
          if (v) {
            if (v.networkError == true) {
              networkErrors++;
            }
            return v.protocolName == companionAppInfo.requiredProtocol && v.productVersion;
          } else {
            return false;
          }
        });
        if (foundIndex >= 0) {
          resolvedResult = resolved[foundIndex];
        } else {
          resolvedResult = undefined;
        }
      }

      if (resolvedResult?.productVersion && companionAppInfo.requiredProductVersion) {
        switch (semverDiff(resolvedResult.productVersion, companionAppInfo.requiredProductVersion)) {
          case 'major':
          case 'premajor':
          case 'minor':
          case 'preminor':
            updateAvailable = true;
            updateRequired = true;
            break;
          case 'patch':
          case 'prepatch':
          case 'prerelease':
            updateAvailable = true;
            updateRequired = false;
          case null:
            break;
          default:
            break;
        }

        const foundPort = resolvedResult.port;
        console.log('Found at port ', foundPort);
        hostname = h;
        setVpnAppPort(foundPort)
        return;
      }
    }
  }

  throw 'Cannot detect app';
};

const getConnectionStatus = async (): Promise<VPNAppConnectionStatus> => {
  if (hostname == undefined || port <= 0) {
    return connectionStatus;
  }

  const result = await axios.get(`https://${hostname}:${port}/api/v1/status`);
  connectionStatus = typia.assert<VPNAppConnectionStatus>(result.data);

  if (connectionStatus) {
    switch (connectionStatus.state) {
      case VPNAppState.CONNECTED:
      case VPNAppState.ERROR:
      case VPNAppState.IDLE:
        // with these status changes reset the busy indicator
        busy: false;
        canceling = false;
        break;
    }

    if (lastVpnState != connectionStatus.state) {
      lastVpnState = connectionStatus.state;
    }
  }

  if (connectionStatus.state == VPNAppState.CONNECTED) {
    loginStatus.vpnLoggedIn = true;
  } else {
    loginStatus.vpnLoggedIn = false;
  }
  
  return connectionStatus;
};

const doAction = async (params: Record<string, string>) => {
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  var urlEncodedParams = new URLSearchParams();
  for (let k in params) {
    urlEncodedParams.append(k, params[k]);
  }
  return axios.post(`https://${hostname}:${port}/api/v1/cloud`, urlEncodedParams, config);
};

const authWithApp = async ({ id = 'sb', url, type = 'user-pass', user, pass }: { id?: string; type?: string; url: string; user: string; pass: string }) => {
  var params = new URLSearchParams();
  params.append('id', id);
  params.append('url', url);
  params.append('type', type);
  params.append('user', user);
  params.append('pass', pass);
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  return axios.post(`https://${hostname}:${port}/api/v1/auth`, params, config);
};

const getCredentials = async (logoutFirst = false): Promise<Credentials> => {
  const result = await axios.post(`${baseUrl}/svc/vpn2/api/v1/credentials/request`, 
    { name: loginStatus.username, domain: loginStatus.orgResourceId },
    {
      headers: { Authorization: `Bearer ${await authService.getAccessToken()}` }
    });
  const credentials = typia.assert<Credentials>(result.data);
  return credentials;
};

export const login = async ({ forceLogin = false }: { forceLogin: boolean }): Promise<any> => {
  // stop app monitoring for a while to avoid reading
  // inconsistent states too soon after a command is issued
  stopVpnAppMonitoring();
  setTimeout(() => startVpnAppMonitoring(), appPollTimeout());

  busy = true;

  try {
    // TODO: check not being connect

    // issue a stop.. just in case
    const stopResult = await doAction({ action: 'stop' });

    // logoff any authenticated user (required to reset all active connections
    // that need to be reestablished via VPN)

    // retrieve credentials
    const credentials = await getCredentials();
    credentials.url = loginStatus.hostname ? `https://${loginStatus.hostname}.${credentials.host}` : `https://${credentials.host}`;

    // config the app ensuring it will exit if connection is closed server side
    // In this way we can avoid endless reconnection loops if other user is already connected
    // const currentConfig : any = await VPNAppAxiosInstance.getConfigApp();
    // currentConfig.exitOnPingRestart = true;
    const configResult = await axios.post(`https://${hostname}:${port}/api/v1/config`, { vpn: { exitOnPingRestart: true }, autoretry: true });

    // pass authentication credentials to the app
    const authResult = await authWithApp({ url: credentials.url, user: `${credentials.name}/${credentials.domain}`, pass: credentials.password });

    // start the app
    const startResult = await doAction({ action: 'start', force: forceLogin.toString() });
  } catch (e) {
    console.error('Error starting vpn...', e);
    busy = false;
  }
};

export const logout = async (): Promise<any> => {
  // stop app monitoring for a while to avoid reading
  // inconsistent states too soon after a command is issued
  stopVpnAppMonitoring();
  setTimeout(() => startVpnAppMonitoring(), appPollTimeout());

  busy = true;
  if (connectionStatus.state == VPNAppState.CONNECTED || connectionStatus.state == VPNAppState.DISCONNECTING) {
    canceling = false;
  } else {
    canceling = true;
  }

  try {
    await doAction({ action: 'stop' });
  } catch (e) {
    busy = false;
    canceling = false;
  }
};

export const syncRoutes = async ( connections: IVPNConnectionResult ) => {
  await doAction({ action: 'syncRoutes', ips: connections.connections.map(c => c.device_ip_address).join(',') });
}

startVpnAppMonitoring();
