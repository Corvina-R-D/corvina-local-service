import { BrowserWindow, Menu, Tray, app, ipcMain, shell } from 'electron';

import * as http from 'http';
import * as path from 'path';
import { createAuthWindow, createLogoutWindow } from './auth-process';
// import { createAppWindow } from './main/app-process';
import { NestFactory } from '@nestjs/core';
import * as authService from './services/auth-service';

import { SwaggerModule } from '@nestjs/swagger';
import YamlContent from './swagger.yaml';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exceptions.filter';

// required to connect to local vpn client in https using the installed self-signed certificate
require('win-ca');

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
    { label: 'Doc', click: () => { shell.openExternal(`http://localhost:${port}/swagger-ui`) }  },
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

  // The API acts with the logged-in user's Corvina credentials and has no
  // authentication of its own: bind to loopback only so it is not reachable
  // from the network. Listen on both IPv4 and IPv6 loopback because clients
  // may resolve "localhost" to either.
  await serverApp.listen(port, '127.0.0.1');
  http
    .createServer(serverApp.getHttpAdapter().getInstance())
    .on('error', (err) => console.warn(`IPv6 loopback listener not available: ${err.message}`))
    .listen(port, '::1');

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  //  app.quit();
});
