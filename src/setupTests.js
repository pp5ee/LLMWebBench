import '@testing-library/jest-dom';

// Environment polyfills for browser APIs used by AntD/Recharts and ensure AntD responsive observer gets a proper matchMedia with addListener/removeListener
const React = require('react');

const makeMql = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Ensure both globalThis and window expose a working matchMedia
// Override unconditionally to a stable mock AntD expects (with addListener/removeListener)
const mockMatchMedia = (query) => makeMql(query);
if (typeof window !== 'undefined') {
  window.matchMedia = mockMatchMedia;
}
globalThis.matchMedia = mockMatchMedia;

if (!globalThis.scrollTo) {
  globalThis.scrollTo = jest.fn();
}

class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock;
}

if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });
}

// Module mocks
jest.mock('tiktoken', () => ({
  __esModule: true,
  encoding_for_model: () => ({
    encode: (text) => Array.from(String(text)),
  }),
}));

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  const React = require('react');
  const ResponsiveContainer = ({ width = 800, height = 600, children }) =>
    React.cloneElement(children, { width, height });
  return { ...actual, ResponsiveContainer };
});

// Stub AntD responsive observer to avoid jsdom matchMedia internals during tests
jest.mock('antd/es/_util/responsiveObserver', () => {
  const responsiveArray = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const subscribers = new Map();
  return {
    __esModule: true,
    default: {
      matchHandlers: {},
      subscribe: (fn) => {
        const token = String(subscribers.size + 1);
        subscribers.set(token, fn);
        return token;
      },
      unsubscribe: (token) => {
        subscribers.delete(token);
      },
      dispatch: (params) => {
        subscribers.forEach((fn) => fn(params));
      },
    },
    responsiveArray,
  };
});

jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  // Keep real components; selectively stub noisy side effects.
  return {
    ...antd,
    message: {
      ...antd.message,
      open: jest.fn(() => ({ then: () => {} })),
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    },
    Modal: {
      ...antd.Modal,
      info: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      confirm: jest.fn(),
    },
  };
});

jest.mock('@ant-design/icons', () =>
  new Proxy({}, {
    get: (_, name) => (props) =>
      require('react').createElement('span', { 'data-icon': String(name), ...props }),
  })
);
