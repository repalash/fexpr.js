/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  testRegex: '/tests/.*\.test?\.ts$',
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};