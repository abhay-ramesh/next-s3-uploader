module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-acme`
  extends: ["eslint-config-custom"],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
};
