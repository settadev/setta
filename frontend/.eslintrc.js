module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["unused-imports", "import", "@typescript-eslint"],
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/display-name": "off",
    "unused-imports/no-unused-imports": "warn",
    // "import/no-unused-modules": [1, { unusedExports: true }],
    "no-unused-vars": "warn",
    "no-undef": "off",
    "react/jsx-uses-react": "warn",
    "react/jsx-uses-vars": "warn",
    "react/jsx-no-duplicate-props": "warn",
    "react/no-children-prop": "warn",
    "no-constant-condition": "warn",
  },

  settings: {
    "import/resolver": {
      "eslint-import-resolver-custom-alias": {
        alias: {
          __tests__: "./src/__tests__",
          classes: "./src/classes",
          codeGeneration: "./src/codeGeneration",
          components: "./src/components",
          data: "./src/data",
          dbRequests: "./src/dbRequests",
          hooks: "./src/hooks",
          models: "./src/models",
          store: "./src/store",
          styles: "./src/styles",
          thunks: "./src/thunks",
          utils: "./src/utils",
          constants: "../constants"
        },
      },
    },
  },
};
