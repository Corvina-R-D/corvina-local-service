import axios from 'axios';
import { randomUUID } from 'crypto';
import FormData from 'form-data';
import * as fs from 'fs';
import NodeCache from 'node-cache';
import * as path from 'path';
import { baseUrl } from '../../../env-variables.json';
import { assertIArtifact, assertIPageIRepository, assertIRepository } from '../templates/types';
import * as authService from './auth-service';
import { IPage, loginStatus } from './common';

let artifactRegistryBaseUrl: string | undefined;

export interface IJobStatus {
  id: string;
  status: string;
  message?: string;
  percentage: number;
  cancel: () => void;
}

let jobCache = new NodeCache({ stdTTL: 15 * 60, useClones: false });

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
  labels?: Record<string, string> | null;
  repositoryName: string;
  resourceUrl: string;
  versions?: string[] | null;
  isLatest?: boolean;
}

export interface IRepository {
  id: string;
  author?: string;
  uploadedAt: string;
  labels?: Record<string, string> | null;
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
  artifactLabels?: Record<string, string>;
  publicAccess?: boolean;
}

export const clearArtifactRegistryBaseUrl = () => {
  artifactRegistryBaseUrl = undefined;
};

interface IApp {
  app: { key: string; manifest: { baseUrl: string } };
}

const getArtifactRegistryBaseUrl = async (): Promise<string | undefined> => {
  if (artifactRegistryBaseUrl == null) {
    const url = `${baseUrl}/svc/core/api/v1/organizations/${loginStatus.organizationId}/apps`;
    const response = await axios.get(url, { params : { page:0, pageSize: 100000}, headers: { Authorization: `Bearer ${await authService.getAccessToken()}` } });
    artifactRegistryBaseUrl = response.data.content.filter((c: IApp) => c.app.key === 'corvina-app-artifact-registry').map((c: IApp) => c.app.manifest.baseUrl);
  }
  return artifactRegistryBaseUrl;
};

export const searchArtifacts = async (query: ISearchArtifactsRequest): Promise<IPage<IArtifact>> => {
  const url = `${await getArtifactRegistryBaseUrl()}/${loginStatus.instanceId}/${loginStatus.organizationId}/artifacts/search`;
  const response = await axios.post(url, query, { headers: { Authorization: `Bearer ${await authService.getAccessToken()}` } });
  return response.data;
};

export const postArtifact = async (
  artifact: IArtifactIn,
  progressCallback?: (progress: number) => void,
  abortController?: AbortController
): Promise<IArtifact> => {
  // check if repository with same artifact name already exists
  const repositoriesUrl = `${await getArtifactRegistryBaseUrl()}/${loginStatus.instanceId}/${loginStatus.organizationId}/repositories`;
  const response = (
    await axios.get(repositoriesUrl, {
      params: {
        search: artifact.repositoryName,
      },
      headers: { Authorization: `Bearer ${await authService.getAccessToken()}` },
    })
  ).data;
  const repositories = assertIPageIRepository(response).content.filter((r: IRepository) => r.name === artifact.repositoryName);
  if (repositories.length === 0) {
    // post the new repository
    const formData = new FormData();
    if (artifact.version) formData.append('version', artifact.version);
    if (artifact.publicAccess) formData.append('publicAccess', artifact.publicAccess.toString());
    if (artifact.labels) {
      formData.append('labels', JSON.stringify(artifact.labels));
      formData.append('artifactLabels', JSON.stringify(artifact.labels));
    }
    else {
      formData.append('labels', '{}'); // is required
      formData.append('artifactLabels', '{}');
    }
    formData.append('name', artifact.repositoryName);
    formData.append('type', artifact.type);
    formData.append('file', fs.createReadStream(artifact.localPath, { highWaterMark: 1024}));
    const result = (
      await axios.post(repositoriesUrl, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${await authService.getAccessToken()}` },
        signal: abortController ? abortController.signal : undefined,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = <number>progressEvent.progress*100;
          if (progressCallback) progressCallback(percentCompleted);
        },
        })
    ).data;
    const parsedResult = assertIRepository(result);
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
  formData.append('file', fs.createReadStream(artifact.localPath,  { highWaterMark: 1024}));
  const result = (
    await axios.post(artifactUrl, formData, {
      headers: { ...formData.getHeaders(), Authorization: `Bearer ${await authService.getAccessToken()}` },
      signal: abortController ? abortController.signal : undefined,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = <number>progressEvent.progress*100;
        if (progressCallback) progressCallback(percentCompleted);
      },
  })
  ).data;
  // fix string size
  result.size = parseInt(result.size, 10);
  const parsedResult = assertIArtifact(result);
  return parsedResult;
};

export const postArtifactAsync = (artifact: IArtifactIn): IJobStatus => {
  let jobId = randomUUID().toString();
  const controller = new AbortController();

  let status = {
    id: jobId,
    status: 'running',
    percentage: 0,
    message: 'Started uploading artifact',
    cancel: () => {
      controller.abort();
    },
  };
  jobCache.set(jobId, status);

  postArtifact(
    artifact,
    (progress: number) => {
      if (status.status != 'error' && status.status != 'cancelled') {
        status.message = 'Upload in progress';
        status.status = 'running';
      }
      status.percentage = Math.min(99,progress);
    },
    controller
  )
    .then((result) => {
      status.message = 'Upload completed';
      status.percentage = 100;
      status.status = 'completed';
    })
    .catch((error: any) => {
      if (error?.code == 'ERR_CANCELED') {
        status.message = 'Upload cancelled';
        status.status = 'cancelled';
      } else {
        console.log("Error uploading: ", error);
        status.message = `Error uploading: ${error}.`;
        if (error?.response?.data) {
          status.message += ` ${JSON.stringify(error.response.data)}`;
        }
        status.status = 'error';
      }
    });

  return status;
};

export const downloadArtifact = async (
  artifactId: string,
  localPath: string,
  progressCallback?: (progress: number) => void,
  abortController?: AbortController
): Promise<void> => {
  const url = `${await getArtifactRegistryBaseUrl()}/${loginStatus.instanceId}/${loginStatus.organizationId}/artifacts/${artifactId}/content`;
  const resolvedPath = path.resolve(localPath);
  const writer = fs.createWriteStream(localPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    signal: abortController ? abortController.signal : undefined,
    onDownloadProgress: (progressEvent) => {
      const percentCompleted = <number>progressEvent.progress*100;
      if (progressCallback) progressCallback(percentCompleted);
    },
    headers: { Authorization: `Bearer ${await authService.getAccessToken()}` },
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(`Download of artifact ${artifactId} to file ${resolvedPath} completed`);
      writer.close();
      resolve();
    });
    writer.on('error', (error) => {
      console.log(`Error downloading artifact ${artifactId} to file ${resolvedPath}`, error);
      writer.close();
      reject(error);
    });
  });
};

export const downloadArtifactAsync = (artifactId: string, localPath: string): IJobStatus => {
  let jobId = randomUUID().toString();
  const controller = new AbortController();

  const status = {
    id: jobId,
    status: 'running',
    percentage: 0,
    message: 'Started downloading artifact',
    cancel: () => {
      controller.abort();
      status.status = 'cancelled';
    },
  };
  jobCache.set(jobId, status);

  downloadArtifact(
    artifactId,
    localPath,
    (progress: number) => {
      if (status.status != 'error' && status.status != 'cancelled') {
        status.message = 'Download in progress';
        status.status = <'running'>'running';
      }
      status.percentage = Math.min(99,progress);
    },
    controller
  )
    .then((result) => {
      status.message = 'Download completed';
      status.percentage = 100;
      status.status = 'completed';
    })
    .catch((error: any) => {
      if (error?.code == 'ERR_CANCELED') {
        status.message = 'Download cancelled';
        status.status = 'cancelled';
      } else {
        status.message = `Error downloading: ${error}`;
        if (error?.response?.data) {
          status.message += ` ${JSON.stringify(error.response.data)}`;
        }
        status.status = 'error';
      }
    });

  return status;
};

export const getJobStatus = (jobId: string): IJobStatus | undefined => {
  return jobCache.get(jobId);
};

export const cancelJob = (jobId: string): IJobStatus | undefined => {
  const job: IJobStatus | undefined = jobCache.get(jobId);
  if (job) {
    job.cancel();
  }
  return job;
};
