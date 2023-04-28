import typia from "typia";
import * as artifactsService from '../services/artifacts-service';
import { ISearchArtifactsRequest } from "../services/artifacts-service";

export const assertISearchArtifactsRequest = typia.createAssert<ISearchArtifactsRequest>();
export const assertIArtifactIn = typia.createAssert<artifactsService.IArtifactIn>();
export const assertIArtifact = typia.createAssert<artifactsService.IArtifact>();
export const assertIRepository = typia.createAssert<artifactsService.IRepository>();
export const assertIPageIRepository = typia.createAssert<artifactsService.IPage<artifactsService.IRepository>>();

export const stringifyIArtifact = typia.createStringify<artifactsService.IArtifact>();
export const stringifyIPageIArtifact = typia.createStringify<artifactsService.IPage<artifactsService.IArtifact>>();