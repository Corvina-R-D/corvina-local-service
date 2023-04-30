import { INestiaConfig } from "@nestia/sdk";
 
const config: INestiaConfig = {
    input: [ "./src/controller.ts" ],
    output: "./public",
    compilerOptions: {
      module: "commonjs",
      allowSyntheticDefaultImports: true,
    },
    swagger: {
        output: "public/swagger.json",
        security: {
            bearer: {
                type: "apiKey",
                name: "Authorization",
                in: "header",
            },
        },
    }
};
export default config;