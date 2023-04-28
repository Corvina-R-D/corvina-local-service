import { BrowserWindow, Menu, Tray, app, ipcMain } from 'electron';

import * as path from 'path';
import { createAuthWindow, createLogoutWindow } from './auth-process';
// import { createAppWindow } from './main/app-process';
import * as authService from './services/auth-service';

import * as controller from './controller';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let tray: Tray;
app.on('ready', () => {
  tray = new Tray(path.join(__dirname, '/icon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', click: () => app.quit() },
    { label: 'Login', click: () => createAuthWindow() },
    { label: 'Logout', click: () => createLogoutWindow() },
  ]);
  tray.setToolTip('Corvina local service');
  tray.setContextMenu(contextMenu);

  // Handle IPC messages from the renderer process.
  ipcMain.handle('auth:get-profile', authService.getProfile);
  ipcMain.on('auth:log-out', () => {
    console.log('logout');
    BrowserWindow.getAllWindows().forEach((window) => window.close());
    createLogoutWindow();
  });

  authService.refreshTokens();

  const port = 5804;

  controller.serverApp.listen(port, () => {
    console.log(`Controller listening on port ${port}`);
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  //  app.quit();
});
