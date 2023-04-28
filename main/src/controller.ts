import * as bodyParser from 'body-parser';
import express from 'express';
import * as swaggerUI from 'swagger-ui-express';
import { createAuthWindow, createLogoutWindow } from './auth-process';
import { assertIArtifactIn, assertISearchArtifactsRequest, stringifyIArtifact, stringifyIPageIArtifact } from './generated/types';
import * as artifactsService from './services/artifacts-service';
import * as authService from './services/auth-service';
import YamlContent from './swagger.yaml';
console.log(YamlContent.example);
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
  assertISearchArtifactsRequest(req.body);
  const result = await artifactsService.searchArtifacts(req.body);
  res.type('application/json').status(200).send(stringifyIPageIArtifact(result));
});

serverApp.post('/artifact-registry/artifacts', async (req, res) => {
  const a = assertIArtifactIn(req.body);
  res
    .type('application/json')
    .status(201)
    .send(stringifyIArtifact(await artifactsService.postArtifact(a)));
});

serverApp.use('/swagger-ui', swaggerUI.serve, swaggerUI.setup(YamlContent));
