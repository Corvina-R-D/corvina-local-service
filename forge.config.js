console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", process.env)
module.exports = {
  packagerConfig: {
    dir: "main/dist",
    ignore: ["main/src", "main/public"]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  publishers: [
    // {
    //   name: '@electron-forge/publisher-github',
    //   config: {
    //     repository: {
    //       owner: 'Corvina-R-D',
    //       name: 'corvina-local-service'
    //     },
    //     prerelease: true
    //   }
    // },
    // {
    //   name: '@electron-forge/publisher-bitbucket',
    //   config: {
    //     replaceExistingFiles: true,
    //     repository: {
    //       owner: 'exorint',
    //       name: 'corvina-local-service'
    //     },
    //     auth: {
    //       username: process.env.BITBUCKET_USERNAME, // string
    //       appPassword: process.env.BITBUCKET_APP_PASSWORD // string
    //     }
    //   }
    // }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be
        // Main process, Preload scripts, Worker process, etc.
        build: [
          {
            // `entry` is an alias for `build.lib.entry`
            // in the corresponding file of `config`.
            entry: 'main/src/main.ts',
            config: 'main/vite.config.js',
          },
          // {
          //   entry: 'src/preload.js',
          //   config: 'vite.preload.config.mjs',
          // },
        ],
        renderer: []
        // renderer: [
        //   {
        //     name: 'main_window',
        //     config: 'vite.renderer.config.mjs',
        //   },
        // ],
      },
    },
  ],
};
