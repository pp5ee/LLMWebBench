import '@testing-library/jest-dom';

// --- Environment mocks for browser APIs used by AntD/Recharts (define on both window and global) ---
const makeMql = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // deprecated
  removeListener: jest.fn(), // deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(makeMql),
  });
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }
}
if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(makeMql),
  });
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = ResizeObserverMock;
}

if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });
}

// --- Module mocks ---
// Mock tiktoken in Jest environment to avoid importing native modules in browser tests
jest.mock('tiktoken', () => ({
  encoding_for_model: () => ({
    encode: (text) => Array.from(String(text))
  })
}));

// Recharts uses complex SVG measurement; provide light mocks to avoid crashes
jest.mock('recharts', () => {
  const React = require('react');
  const Mock = ({ children }) => React.createElement('div', null, children);
  return new Proxy({}, { get: () => Mock });
});

// Mock antd to lightweight components with minimal API surface used by App
jest.mock('antd', () => {
  const React = require('react');
  const Pass = ({ children, ...rest }) => React.createElement('div', rest, children);
  const Form = Object.assign(Pass, {
    useForm: () => [{ resetFields: () => {} }],
    Item: Pass,
  });
  const Layout = Object.assign(Pass, {
    Header: Pass,
    Content: Pass,
    Footer: Pass,
  });
  const Modal = Object.assign(Pass, { info: () => {} });
  return {
    Layout,
    Input: Object.assign(Pass, { TextArea: Pass, Password: Pass }),
    Button: Pass,
    Form,
    Card: Pass,
    Table: Pass,
    Progress: Pass,
    message: { success: () => {}, error: () => {}, warning: () => {} },
    Space: Pass,
    Checkbox: Object.assign(Pass, { Group: Pass }),
    Divider: Pass,
    Tooltip: Pass,
    Modal,
  };
});

jest.mock('@ant-design/icons', () => {
  const React = require('react');
  return new Proxy({}, { get: () => (props) => React.createElement('span', props) });
});
