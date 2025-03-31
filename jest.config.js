/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  testRegex: '/tests/.*\.test?\.ts$',
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};