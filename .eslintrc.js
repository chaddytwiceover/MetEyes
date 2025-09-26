module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    parserOptions: {
        'ecmaVersion': 2018,
    },
    extends: [
        'eslint:recommended',
        'google',
    ],
    rules: {
        'no-restricted-globals': ['error', 'name', 'length'],
        'prefer-arrow-callback': 'error',
        'quotes': ['error', 'single', {'allowTemplateLiterals': true}],
        'indent': ['error', 4],
        'max-len': ['error', {'code': 120, 'ignoreUrls': true, 'ignoreStrings': true}],
        'require-jsdoc': ['warn', {
            'require': {
                'FunctionDeclaration': true,
                'MethodDefinition': true,
                'ClassDeclaration': true,
                'ArrowFunctionExpression': false,
                'FunctionExpression': false,
            },
        }],
        'valid-jsdoc': ['warn'],
        'comma-dangle': ['error', 'always-multiline'],
        'object-curly-spacing': ['error', 'never'],
    },
    overrides: [
        {
            // Test files configuration
            files: ['**/*.test.js', '**/tests/**/*.js', '**/src/**/*.test.js', '**/setupTests.js'],
            env: {
                jest: true,
                node: true,
            },
            globals: {
                'jest': 'readonly',
                'beforeAll': 'readonly',
                'afterAll': 'readonly',
                'beforeEach': 'readonly',
                'afterEach': 'readonly',
                'describe': 'readonly',
                'test': 'readonly',
                'it': 'readonly',
                'expect': 'readonly',
            },
            rules: {
                'require-jsdoc': 'off',
                'max-len': ['error', {'code': 120}],
            },
        },
        {
            // Functions directory (Firebase Cloud Functions)
            files: ['functions/**/*.js'],
            env: {
                node: true,
                es6: true,
            },
            extends: [
                'eslint:recommended',
                'google',
            ],
            rules: {
                'no-restricted-globals': ['error', 'name', 'length'],
                'prefer-arrow-callback': 'error',
                'quotes': ['error', 'double', {'allowTemplateLiterals': true}],
            },
        },
    ],
    globals: {
        // Global variables for browser environment
        'fetch': 'readonly',
        'console': 'readonly',
        'window': 'readonly',
        'document': 'readonly',
    },
};
