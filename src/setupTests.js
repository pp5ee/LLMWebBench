import '@testing-library/jest-dom';

// Environment polyfills for browser APIs used by AntD/Recharts
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

if (!globalThis.matchMedia) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(makeMql),
  });
}

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
  const ReactLocal = require('react');
  const Mock = ({ children }) => ReactLocal.createElement(ReactLocal.Fragment, null, children);
  return new Proxy({ __esModule: true, default: {} }, { get: () => Mock });
});

jest.mock('antd', () => {
  const ReactLocal = require('react');
  const Pass = ({ children, className, style, id, onClick, onChange, value, placeholder, type }) =>
    ReactLocal.createElement('div', { className, style, id, onClick, onChange, value, placeholder, type }, children);
  const Form = Object.assign(Pass, {
    useForm: () => [{ resetFields: () => {} }],
    Item: Pass,
  });
  const Layout = Object.assign(Pass, {
    Header: Pass,
    Content: Pass,
    Footer: Pass,
  });
  const Modal = Object.assign(Pass, { info: jest.fn() });
  return {
    __esModule: true,
    default: {},
    Layout,
    Input: Object.assign(Pass, { TextArea: Pass, Password: Pass }),
    Button: Pass,
    Form,
    Card: Pass,
    Table: Pass,
    Progress: Pass,
    message: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
    Space: Pass,
    Checkbox: Object.assign(Pass, { Group: Pass }),
    Divider: Pass,
    Tooltip: Pass,
    Modal,
  };
});

jest.mock('@ant-design/icons', () => {
  const ReactLocal = require('react');
  const Icon = (props) => ReactLocal.createElement('span', props);
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === '__esModule') return true;
      if (prop === 'default') return Icon;
      return Icon;
    }
  });
});
