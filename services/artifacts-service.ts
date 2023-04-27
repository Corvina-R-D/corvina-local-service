import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
/* eslint-disable-next-line import/no-extraneous-dependencies */
import typia from 'typia';
import { baseUrl } from '../env-variables.json';
import * as authService from './auth-service';

let artifactRegistryBaseUrl: string | undefined;

export interface ISearchArtifactsRequest {
  page: number;
  pageSize: number;
  search?: string;
  type?: string;
  labels?: Record<string, string>;
  repositoryName?: string;
  isLatest?: boolean;
}

export interface IArtifact {
  id: string;
  author?: string;
  type: string;
  size: number;
  uploadedAt: string;
  labels?: Record<string, string>;
  repositoryName: string;
  resourceUrl: string;
  versions?: string[] | null;
  isLatest?: boolean;
}

export interface IRepository {
  id: string;
  author?: string;
  uploadedAt: string;
  labels?: Record<string, string>;
  name: string;
  resourceUrl: string;
  versions?: string[] | null;
}

export interface IArtifactIn {
  localPath: string;
  repositoryName: string;
  version?: string;
  type: string;
  labels?: Record<string, string>;
  publicAccess?: boolean;
}

export interface IPage<T> {
  number: number;
  totalPages: number;
  totalElements: number;
  size: number;
  last: boolean;
  content: T[];
}

export const clearArtifactRegistryBaseUrl = () => {
  artifactRegistryBaseUrl = undefined;
};

interface IApp {
  app: { key: string; manifest: { baseUrl: string } };
}

const getArtifactRegistryBaseUrl = async (): Promise<string | undefined> => {
  if (artifactRegistryBaseUrl == null) {
    const url = `${baseUrl}/svc/core/api/v1/organizations/${authService.status.organizationId}/apps`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${await authService.getAccessToken()}` } });
    artifactRegistryBaseUrl = response.data.content.filter((c: IApp) => c.app.key === 'corvina-app-artifact-registry').map((c: IApp) => c.app.manifest.baseUrl);
  }
  return artifactRegistryBaseUrl;
};

export const searchArtifacts = async (query: ISearchArtifactsRequest): Promise<IPage<IArtifact>> => {
  const url = `${await getArtifactRegistryBaseUrl()}/${authService.status.instanceId}/${authService.status.organizationId}/artifacts/search`;
  const response = await axios.post(url, query, { headers: { Authorization: `Bearer ${await authService.getAccessToken()}` } });
  return response.data;
};

export const postArtifact = async (artifact: IArtifactIn): Promise<IArtifact> => {
  // check if repository with same artifact name already exists
  const repositoriesUrl = `${await getArtifactRegistryBaseUrl()}/${authService.status.instanceId}/${authService.status.organizationId}/repositories`;
  const response = (
    await axios.get(repositoriesUrl, {
      params: {
        search: artifact.repositoryName,
      },
      headers: { Authorization: `Bearer ${await authService.getAccessToken()}` },
    })
  ).data;
  const repositories = typia.assert<IPage<IRepository>>(response).content.filter((r) => r.name === artifact.repositoryName);
  if (repositories.length === 0) {
    // post the new repository
    const formData = new FormData();
    if (artifact.version) formData.append('version', artifact.version);
    if (artifact.publicAccess) formData.append('publicAccess', artifact.publicAccess);
    if (artifact.labels) formData.append('labels', JSON.stringify(artifact.labels));
    else {
      formData.append('labels', '{}'); // is required
    }
    formData.append('name', artifact.repositoryName);
    formData.append('type', artifact.type);
    formData.append('file', fs.createReadStream(artifact.localPath));
    const result = (
      await axios.post(repositoriesUrl, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${await authService.getAccessToken()}` },
      })
    ).data;
    const parsedResult = typia.assert<IRepository>(result);
    // get the latest pushed artifact
    return (await searchArtifacts({ page: 0, pageSize: 1, repositoryName: parsedResult.name, isLatest: true, type: artifact.type })).content[0];
  }

  const repository = repositories[0];
  const artifactUrl = `${repositoriesUrl}/${repository.id}/artifacts`;
  const formData = new FormData();
  if (artifact.version) formData.append('version', artifact.version);
  if (artifact.labels) formData.append('labels', JSON.stringify(artifact.labels));
  else {
    formData.append('labels', '{}'); // is required
  }
  formData.append('type', artifact.type);
  formData.append('file', fs.createReadStream(artifact.localPath));
  const result = (
    await axios.post(artifactUrl, formData, {
      headers: { ...formData.getHeaders(), Authorization: `Bearer ${await authService.getAccessToken()}` },
    })
  ).data;
  // fix string size
  result.size = parseInt(result.size, 10);
  const parsedResult = typia.assert<IArtifact>(result);
  return parsedResult;
};
