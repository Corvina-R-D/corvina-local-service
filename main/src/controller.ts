import * as authProcess from './auth-process';
import * as artifactsService from './services/artifacts-service';
import * as authService from './services/auth-service';
//import YamlContent from './swagger.yaml';
import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { IArtifact, IPage } from './services/artifacts-service';


@Controller("/")
export class AppController {

    /**
     * Returns current login status
     */
    @TypedRoute.Get("/status")
    public async status(): Promise<authService.ILoginStatus> {
      return authService.status;
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
     * Get an artifact content
     */
    @TypedRoute.Get("/artifact-registry/artifacts/:artifactId/content")
    public async downloadArtifact(@TypedParam("artifactId") artifactId : string, @TypedQuery() query : { localPath: string } ): Promise<any> {
        await artifactsService.downloadArtifact(artifactId, query.localPath);
        return "";
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