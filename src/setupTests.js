// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock tiktoken in Jest environment to avoid importing native modules in browser tests
jest.mock('tiktoken', () => ({
  encoding_for_model: () => ({
    encode: (text) => Array.from(String(text))
  })
}));
