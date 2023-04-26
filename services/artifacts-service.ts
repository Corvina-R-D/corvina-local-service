import * as authService from './auth-service'
import axios from 'axios';
import {baseUrl, clientId, wellKnown} from '../env-variables.json';


let artifactRegistryBaseUrl: string = null;

export interface SearchArtifactsRequest {
    page: number,
    pageSize: number,
    search?: string,
    type?: string,
    labels?: string[],
    repositoryName?: string,
}

export interface Artifact {
    id : string;
    author ?: string;
    type: string;
    size : number;
    uploadedAt : string;
    labels: string[];
    repositoryName: string;
    resourceUrl: string;
    versions?: string[];
    isLatest: boolean;
}

export interface Page<T> {
    number: number;
    totalPages: number;
    totalElements: number;
    size: number;
    last:boolean;
    content: T[];
}


export const clearArtifactRegistryBaseUrl =  () => {
    artifactRegistryBaseUrl = null;
}

interface App {
    app: {key: string, manifest: { baseUrl: string } }   
}

const getArtifactRegistryBaseUrl = async () : Promise<string> =>  {
    if (artifactRegistryBaseUrl == null) {
        const url = `${baseUrl}/svc/core/api/v1/organizations/${authService.status.organizationId}/apps`;
        const response = await axios.get(url, 
            { headers: { Authorization: `Bearer ${await authService.getAccessToken()}` }
        })
        artifactRegistryBaseUrl = response.data.content
            .filter((c : App) => c.app.key == 'corvina-app-artifact-registry')
            .map( (c : App ) => c.app.manifest.baseUrl );
    }
    return artifactRegistryBaseUrl;
}


export const searchArtifacts = async (query: SearchArtifactsRequest) : Promise<Page<Artifact>> => {
    const url = `${await getArtifactRegistryBaseUrl()}/${authService.status.instanceId}/${authService.status.organizationId}/artifacts/search`;
    const response = await axios.post(url, query, { headers: { Authorization: `Bearer ${await authService.getAccessToken()}` } });
    const responseContent = response.data.content;
    return {
        number: responseContent.number,
        totalPages: responseContent.totalPages,
        totalElements: responseContent.totalElements,
        size: responseContent.size,
        last: responseContent.last,
        content: responseContent.map( (a : Artifact) => {
            return {
                id: a.id,
                author: a.author,
                type: a.type,
                size: a.size,
                uploadedAt: a.uploadedAt,
                labels: a.labels,
                repositoryName: a.repositoryName,
                resourceUrl: a.resourceUrl,
                versions: a.versions,
                isLatest: a.isLatest
            }
        })
    }
}