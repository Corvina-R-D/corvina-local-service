import axios from 'axios';
import typia from 'typia';
import { baseUrl } from '../../../env-variables.json';
import * as authService from './auth-service';
import { IPage, loginStatus } from './common';
import * as vpnappService from './vpnapp-service';

vpnappService.startVpnAppMonitoring();


export type IVpnGatewayStatus =  "all" | "online" | "offline" | "in-use";

export interface IVPNGatewayIn {
  page: number;
  pageSize: number;
  status?: IVpnGatewayStatus;
  nameFilter?: string;
  sortDir?: "ASC"|"DESC";
}

export interface IVPNEndpoint {
  deviceId: string;
  name: string;
  connectedUsers: {name: string}[];
  currentIpAddress ?: string;
  connected ?: boolean;

}

export interface IVPNGateway {
  gatewayId: string;
  deviceId: string;
  name: string;
  status: IVpnGatewayStatus;
  otpRequired: boolean;
  endpoints: IVPNEndpoint[];
}

export interface IVPNConnectionResult {
  connections: {
    device_ip_address: string
  }[];
}

export const getGateways = async (query: IVPNGatewayIn) : Promise<IPage<IVPNGateway>> => {
  const url = `${baseUrl}/svc/vpn2/api/v1/gateways/${loginStatus.orgResourceId}`;
  const response = await axios.get(url, {
    params: query,
    headers: { Authorization: `Bearer ${await authService.getAccessToken()}` }
  })
  return response.data;
}

export const connectToEndpoint = async (gatewayId: string, endpointId: string) => {
  if (vpnappService.appStatus !== vpnappService.VPNAppStatus.DETECTED_AND_RUNNING) {
    throw new Error("VPN companion app is not running or has not been detected");
  }
  if (vpnappService.connectionStatus.state != vpnappService.VPNAppState.CONNECTED) {
    await vpnappService.login( { forceLogin: true} );
  }
  // poll every second for up to 30 seconds till VPNAppState becomes CONNECTED
  for (let i = 0; i < 30; i++) {
    if (vpnappService.connectionStatus.state == vpnappService.VPNAppState.CONNECTED) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (vpnappService.connectionStatus.state != vpnappService.VPNAppState.CONNECTED) {
    throw new Error("VPN companion could not connect");
  }
 
  const result = await axios.get(`${baseUrl}/svc/vpn2/api/v1/connections/${loginStatus.orgResourceId}/${gatewayId}/endpoints/${endpointId}/connect`, 
  {
    params: { clientOs: 'Win', onlyGateway: false },
    headers: { Authorization: `Bearer ${await authService.getAccessToken()}` }
  });
  const connections = typia.assert<IVPNConnectionResult>(result.data);

  vpnappService.syncRoutes(connections);  
}


export const disconnectFromEndpoint = async (gatewayId: string, endpointId: string) => {
  const result = await axios.get(`${baseUrl}/svc/vpn2/api/v1/connections/${loginStatus.orgResourceId}/${gatewayId}/endpoints/${endpointId}/disconnect`, 
  {
    params: { onlyGateway: false },
    headers: { Authorization: `Bearer ${await authService.getAccessToken()}` }
  });
}
