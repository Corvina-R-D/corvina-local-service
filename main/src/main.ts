import { BrowserWindow, Menu, Tray, app, ipcMain } from 'electron';

import * as path from 'path';
import { createAuthWindow, createLogoutWindow } from './auth-process';
// import { createAppWindow } from './main/app-process';
import { NestFactory } from '@nestjs/core';
import * as authService from './services/auth-service';

import { SwaggerModule } from '@nestjs/swagger';
import YamlContent from './swagger.yaml';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exceptions.filter';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let tray: Tray;
app.on('ready', async () => {
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

  const serverApp = await NestFactory.create(AppModule);

  serverApp.useGlobalFilters(new HttpExceptionFilter());

  const docs : any = YamlContent;
  SwaggerModule.setup('swagger-ui-complete', serverApp, docs);

  const document = require( "./swagger.json" );
  document.servers = [
    { url: `http://localhost:${port}` }
  ];
  document.info = {
    title: "Corvina Local Server API"
  };
  SwaggerModule.setup('swagger-ui-current', serverApp, document);
  SwaggerModule.setup('swagger-ui', serverApp, document);

  serverApp.listen(5804);

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  //  app.quit();
});
