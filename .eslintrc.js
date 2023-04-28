module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  // parserOptions: {
  //   project: 'tsconfig.json',
  //   tsconfigRootDir: __dirname,
  //   sourceType: 'module',
  // },
  ignorePatterns: ['.eslintrc.js'],
  plugins: [
    'import', // needed to manage correctly import statement
    'prettier', // formatter
  ],
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base', // needed to show javascript error (prefer-destructuring, prefer-arrow-function, etc...)
    'airbnb-typescript/base', // needed to show typescript specific error
    'plugin:prettier/recommended', // formatter
  ],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        // it's mandatory with import statement to managed dependencies
        devDependencies: ['**/__mocks__/**', '**/*+(.|-)+(spec|test).?(ts|js)?(x)', 'scripts/**', 'babel.config.js', '.eslintrc.js'],
      },
    ],
    'no-underscore-dangle': 'off', // it's to disable rule that doesn't allow underscore in var names
    '@typescript-eslint/no-explicit-any': 'off', // it's to disable rule that doens't allow Array<any> or similar
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'import/prefer-default-export': 'off', // it's to disable rule that force to use export default that gives problem in typescript
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface', // rule to set as mandatory the char I at the beginning of interfaces
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'property', // rule to set as mandatory the underscore in the beginning of private properties
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
      },
      {
        selector: 'property', // rule to set as mandatory UPPER_CASE in case of private static readonly
        modifiers: ['private', 'static', 'readonly'],
        format: ['UPPER_CASE'],
      },
    ],
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    '@typescript-eslint/parameter-properties': ['error'],
  },
};
