# Stask

This projects uses:
* nestjs with express 5 and nestia
* electron forge

# Build

## Swagger update

Is required to update the swagger.json file when interfaces changed before a new build.

`npm run build:swagger`

Debugging (from a javascript debug terminal in vscode)

`npm run  start:dev`

# Packaging

`npm run make`

# Publishing

`npm run publish`


# Troublshooting

`npm i --force` is required since we are using express 5 which has some conflicts with other packages. 

The swagger is built using commonjs while the production build is using es6 modules. 
