import { INestiaConfig } from "@nestia/sdk";
 
const config: INestiaConfig = {
    input: [ "./src/controller.ts" ],
    output: "./public",
    compilerOptions: {
      module: "commonjs"
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