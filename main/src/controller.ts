import * as authProcess from './auth-process';
import * as artifactsService from './services/artifacts-service';
import * as vpnService from './services/vpn-service';
//import YamlContent from './swagger.yaml';
import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { IArtifact } from './services/artifacts-service';
import { ILoginStatus, IPage, loginStatus } from './services/common';
import { IVPNGatewayIn } from './services/vpn-service';


@Controller("/")
export class AppController {

    /**
     * Returns current login status
     */
    @TypedRoute.Get("/status")
    public async status(): Promise<ILoginStatus> {
      return loginStatus;
    }

    /**
     * Returns current login status
     */
    @TypedRoute.Get("/login")
    public async login(): Promise<void> {
      authProcess.createAuthWindow();
    }

    /**
     * Returns current login status
     */
    @TypedRoute.Get("/logout")
    public async logout(): Promise<void> {
      authProcess.createLogoutWindow;
    }

    /**
     * Search for artifacts
     */
    @TypedRoute.Post("/artifact-registry/artifacts/search")
    public async artifactsSearch(@TypedBody() input : artifactsService.ISearchArtifactsRequest): Promise<IPage<IArtifact>> {
        return await artifactsService.searchArtifacts(input);
    }

    /**
     * Upload new artifacts
     */
    @TypedRoute.Post("/artifact-registry/artifacts")
    public async uploadArtifact(@TypedBody() input : artifactsService.IArtifactIn): Promise<IArtifact> {
        return await artifactsService.postArtifact(input);
    }

    /**
     * Async upload version. Returns a job ID to monitor for upload status
     */
    @TypedRoute.Post("/artifact-registry/artifacts/async")
    public async uploadArtifactAsync(@TypedBody() input : artifactsService.IArtifactIn): Promise<artifactsService.IJobStatus> {
        return artifactsService.postArtifactAsync(input);
    }
    
    /**
     * Get an artifact content
     */
    @TypedRoute.Get("/artifact-registry/artifacts/:artifactId/content")
    public async downloadArtifact(@TypedParam("artifactId") artifactId : string, @TypedQuery() query : { localPath: string } ): Promise<any> {
        await artifactsService.downloadArtifact(artifactId, query.localPath);
        return "";
    }

    /**
     * Get an artifact content. Async version returns a job ID to monitor for download status
     */
    @TypedRoute.Get("/artifact-registry/artifacts/:artifactId/content/async")
    public async downloadArtifactAsync(@TypedParam("artifactId") artifactId : string, @TypedQuery() query : { localPath: string } ): Promise<artifactsService.IJobStatus> {
        return artifactsService.downloadArtifactAsync(artifactId, query.localPath);
    }

    /**
     * Get an artifact job status
     */
    @TypedRoute.Get("/artifact-registry/jobs/:jobId")
    public jobStatus(@TypedParam("jobId") jobId : string): artifactsService.IJobStatus | undefined {
        return artifactsService.getJobStatus(jobId);
    }

    /**
     * Cancel ongoing job
     */
    @TypedRoute.Delete("/artifact-registry/jobs/:jobId")
    public cancelJob(@TypedParam("jobId") jobId : string): artifactsService.IJobStatus | undefined {
        return artifactsService.cancelJob(jobId);
    }


    /**
     * Get VPN gateways
     */
    @TypedRoute.Get("/vpn/gateways")
    public gateways(@TypedQuery() query : IVPNGatewayIn ): Promise<IPage<vpnService.IVPNGateway>> {
        return vpnService.getGateways(query);
    }
    
    
  }

/* 

serverApp.post('/artifact-registry/artifacts', async (req, res) => {
  const a = assertIArtifactIn(req.body);
  res
    .type('application/json')
    .status(201)
    .send(stringifyIArtifact(await artifactsService.postArtifact(a)));
});

//serverApp.use('/swagger-ui', swaggerUI.serve, swaggerUI.setup(YamlContent));
*/