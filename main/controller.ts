import * as bodyParser from 'body-parser';
import * as express from 'express';
/* eslint-disable-next-line import/no-extraneous-dependencies */
import typia from 'typia';
import * as artifactsService from '../services/artifacts-service';
import * as authService from '../services/auth-service';
import { createAuthWindow, createLogoutWindow } from './auth-process';

// start express0
export const serverApp = express();
// parse application/x-www-form-urlencoded
serverApp.use(bodyParser.json());

serverApp.get('/status', (req, res) => {
  res.json(authService.status);
});

serverApp.post('/login', (req, res) => {
  createAuthWindow();
  res.sendStatus(200);
});

serverApp.post('/logout', (req, res) => {
  createLogoutWindow();
  res.sendStatus(200);
});

serverApp.post('/artifact-registry/artifacts/search', async (req, res) => {
  typia.assert<artifactsService.ISearchArtifactsRequest>(req.body);
  const result = await artifactsService.searchArtifacts(req.body);
  res.type('application/json').status(200).send(typia.stringify<artifactsService.IPage<artifactsService.IArtifact>>(result));
});

serverApp.post('/artifact-registry/artifacts', async (req, res) => {
  const a = typia.assert<artifactsService.IArtifactIn>(req.body);
  res
    .type('application/json')
    .status(201)
    .send(typia.stringify<artifactsService.IArtifact>(await artifactsService.postArtifact(a)));
});
