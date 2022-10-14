module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    "plugin:@typescript-eslint/eslint-recommended",
    'eslint-config-ali/typescript/react',
    'prettier',
  ],
  plugins: [
    'simple-import-sort',
    'prettier', 'react', '@typescript-eslint', 'react-hooks'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/indent': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    'max-len': 0,
    'no-console': 'off',
    'comma-dangle': [
      2,
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      },
    ],
    radix: ['error', 'as-needed'],
  },
  overrides: [
    {
      "files": "src/**/*.{js,jsx,ts,tsx,less}",
      rules: {
        "simple-import-sort/imports": [
          'error',
          {
            groups:[
              ["^react", "^(antd|@ant)", "^[0-9a-zA-Z-]*$", "^@bcs"],
              // Internal packages.
              ["^@\/(?!api).*"],
              // Side effect imports.
              ["^\\u0000"],
              // Parent imports. Put `..` last.
              ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
              // Other relative imports. Put same-folder imports and `.` last.
              ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
              ["^@\/api"],
              // Style imports.
              ["^.+\\.less$"],
            ]
          }
        ]
      }
    }
  ]
};
