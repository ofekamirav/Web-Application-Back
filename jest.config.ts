/** @type {import('ts-jest/dist/types').InitialOpitionsTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./src/tests/setup.ts'],
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'], 
}
