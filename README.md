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

In windows might be required to have admin privileges to run the command:

```
Start-Process powershell -Verb RunAs -ArgumentList "-Command", "cd $PWD ; npm run make ; pause"
```

# Publishing

The bitbucket publisher does not work (authentication does not support bearer).

Manually copy files in repository downloads from folder `out/make/squirrel.windows/x64` .

`npm run publish`


# Troublshooting

`npm i --force` is required since we are using express 5 which has some conflicts with other packages. 

The swagger is built using commonjs while the production build is using es6 modules. 
