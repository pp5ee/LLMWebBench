import '@testing-library/jest-dom';

// Polyfills/mocks for JSDOM to support AntD/Recharts
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

if (typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line no-global-assign
  window.ResizeObserver = ResizeObserverMock;
}

// Stub tiktoken to avoid WASM dependency in tests
jest.mock('tiktoken', () => ({
  encoding_for_model: () => ({
    encode: (s) => Array.from(s).map(() => 0),
  }),
}));

// Mock recharts to simplify rendering in test environment
import React from 'react';
jest.mock('recharts', () => {
  const React = require('react');
  const Container = ({ children }) => React.createElement('div', null, children);
  const Null = () => null;
  return {
    BarChart: Container,
    Bar: Null,
    XAxis: Null,
    YAxis: Null,
    CartesianGrid: Null,
    Tooltip: Null,
    Legend: Null,
    PieChart: Container,
    Pie: Container,
    Cell: Null,
  };
});

// Minimal mock for antd to avoid JSDOM measurement errors in tests
jest.mock('antd', () => {
  const React = require('react');
  const Comp = ({ children, ...rest }) => React.createElement('div', rest, children);
  const Layout = Comp; Layout.Header = Comp; Layout.Content = Comp; Layout.Footer = Comp;
  const Input = Comp; Input.TextArea = Comp; Input.Password = Comp;
  const Button = Comp; const Card = Comp; const Table = Comp; const Progress = Comp; const Space = Comp; const Checkbox = Comp; Checkbox.Group = Comp; const Divider = Comp; const Tooltip = Comp; const Modal = { info: jest.fn() };
  const Form = Comp; Form.useForm = () => ([{}]); Form.Item = Comp;
  const message = { success: jest.fn(), error: jest.fn(), warning: jest.fn() };
  return { Layout, Input, Button, Form, Card, Table, Progress, message, Space, Checkbox, Divider, Tooltip, Modal };
});

// Mock icons to simple null components
jest.mock('@ant-design/icons', () => ({
  QuestionCircleOutlined: () => null,
}));
