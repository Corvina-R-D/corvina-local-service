import { BrowserWindow } from 'electron';
import * as artifactsService from './services/artifacts-service';
import * as authService from './services/auth-service';
// import { createAppWindow } from '../main/app-process';
import * as envVariables from '../../env-variables.json';
const { debugEnabled } = envVariables;


let loginWindow: BrowserWindow | null = null;
let logoutWindow: BrowserWindow | null = null;

function destroyAuthWin() {
  if (!loginWindow) return;
  loginWindow.close();
  loginWindow = null;
}

export async function createAuthWindow() {
  artifactsService.clearArtifactRegistryBaseUrl();

  destroyAuthWin();

  loginWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      // devTools: true,
      // enableRemoteModule: false
    },
    show: true,
    alwaysOnTop: true,
  });

  loginWindow.loadURL(await authService.getAuthenticationURL());
  if (debugEnabled) {
    loginWindow.webContents.openDevTools();
  }

  const {
    session: { webRequest },
  } = loginWindow.webContents;

  webRequest.onBeforeRequest({
    urls: [`${authService.selectOrgRedirectUri}*`, `${authService.redirectUri}*`],
  }, async ({ url }) => {
    if (url.startsWith(authService.selectOrgRedirectUri)) {
      const organizationId = (new URL(url)).searchParams.get('org')?.split(",")[1];
      loginWindow!.loadURL(await authService.getAuthenticationURL(authService.getOrgResourceId(parseInt(organizationId!))));
    } else {
      try {
        await authService.loadTokens(url);
        return destroyAuthWin();
      } catch(e) {
        if (loginWindow && e instanceof authService.OrganizationSelectionRequiredException) {
          // suborganization selection is required
          loginWindow.loadURL(await authService.getLoginSelectionUrl());
        } else {
          throw e;
        }
      }
    }
  });

  webRequest.onCompleted({ urls: ['https://*/*logout-confirm*', 'https://*/*logout_response*'] }, async ({ url }) => {
    await authService.logout();
    if (logoutWindow != null) {
      logoutWindow.close();
    }
  });

  loginWindow.on('authenticated' as any, () => {
    destroyAuthWin();
  });

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

export async function createLogoutWindow() {
  logoutWindow = new BrowserWindow({
    show: true,
    alwaysOnTop: true,
  });

  const logoutUrl = await authService.getLogOutUrl();

  logoutWindow.loadURL(logoutUrl);

  const {
    session: { webRequest },
  } = logoutWindow.webContents;
  webRequest.onCompleted({ urls: ['https://*/*logout-confirm*', 'https://*/*logout_response*'] }, async ({ url }) => {
    await authService.logout();
    if (logoutWindow != null) {
      logoutWindow.close();
    }
  });
}
