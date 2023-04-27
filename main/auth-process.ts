import { BrowserWindow } from 'electron';
import * as artifactsService from '../services/artifacts-service';
import * as authService from '../services/auth-service';
// import { createAppWindow } from '../main/app-process';

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

  const authenticationUrl = await authService.getAuthenticationURL();

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
  loginWindow.webContents.openDevTools();

  const {
    session: { webRequest },
  } = loginWindow.webContents;

  const filter = {
    urls: ['http://localhost/callback*'],
  };

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    await authService.loadTokens(url);
    return destroyAuthWin();
  });

  webRequest.onCompleted({ urls: ['https://*/*logout-confirm*', 'https://*/*logout_response*'] }, async ({ url }) => {
    console.log('----------------------------------------------', url);
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
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++', url);
    await authService.logout();
    if (logoutWindow != null) {
      logoutWindow.close();
    }
  });
}
