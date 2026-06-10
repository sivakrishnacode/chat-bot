module.exports = {
  apps: [
    {
      name: "botflow-studio",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3030",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
