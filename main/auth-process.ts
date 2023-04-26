import { BrowserWindow } from 'electron';
import * as authService from '../services/auth-service';
import * as artifactsService from '../services/artifacts-service';
// import { createAppWindow } from '../main/app-process';

let win : BrowserWindow = null;
let logoutWindow : BrowserWindow = null;

export async function createAuthWindow() {

  artifactsService.clearArtifactRegistryBaseUrl();

  destroyAuthWin();

  const authenticationUrl = await authService.getAuthenticationURL();

  win = new BrowserWindow({
    width: 1000,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      devTools: true,
      //enableRemoteModule: false
    },
    show: true,
    alwaysOnTop: true,
    
  });

  win.loadURL(await authService.getAuthenticationURL());
  win.webContents.openDevTools();

  const {session: {webRequest}} = win.webContents;

  const filter = {
    urls: [
      'http://localhost/callback*'
    ]
  };

  webRequest.onBeforeRequest(filter, async ({url}) => {
    await authService.loadTokens(url);
    //createAppWindow();
    return destroyAuthWin();
  });


  webRequest.onCompleted({ urls: ['https://*/*logout-confirm*', 'https://*/*logout_response*'] }, async ({url}) => {
    await authService.logout();
    logoutWindow.close();
  })

  win.on('authenticated' as any, () => {
    destroyAuthWin();
  });

  win.on('closed', () => {
    win = null;
  });
}

function destroyAuthWin() {
  if (!win) return;
  win.close();
  win = null;
}

export async function createLogoutWindow() {
  logoutWindow = new BrowserWindow({
    show: true,
    alwaysOnTop: true,
  });

  const logoutUrl = await authService.getLogOutUrl();

  logoutWindow.loadURL(logoutUrl);

}
