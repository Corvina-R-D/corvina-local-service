export interface IPage<T> {
  number: number;
  totalPages: number;
  totalElements: number;
  size: number;
  last: boolean;
  content: T[];
}

export interface ILoginStatus {
  loggedIn: boolean;
  vpnLoggedIn?: boolean;
  username: string;
  organization: string;
  orgResourceId: string;
  organizationId: string | null;
  instanceId: string;
  lastError: string;
  hostname: string | null;
}

export const loginStatus: ILoginStatus = {
  loggedIn: false,
  vpnLoggedIn: false,
  username: '',
  organization: '',
  orgResourceId: '',
  lastError: '',
  instanceId: '',
  organizationId: null,
  hostname: ''
};
