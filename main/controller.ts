import * as express from 'express';
import * as authService from '../services/auth-service';
import * as artifactsService from '../services/artifacts-service';
import { createAuthWindow, createLogoutWindow } from './auth-process';

import * as  bodyParser from 'body-parser';



// start express0
export const serverApp = express();
// parse application/x-www-form-urlencoded
serverApp.use(bodyParser.json());

serverApp.get('/status', (req, res) => {
  res.json( authService.status )
})

serverApp.post('/login', (req, res) => {
  createAuthWindow();
  res.sendStatus(200);
})

serverApp.post('/logout', (req, res) => {
  createLogoutWindow();
  res.sendStatus(200);
})

serverApp.post('/artifact-registry/artifacts/search', async (req, res) => {
  const result = await artifactsService.searchArtifacts(req.body);
  res.json(result);
})