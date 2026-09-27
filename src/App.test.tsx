import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ path, element }: { path: string; element: React.ReactElement }) => path === '/' ? element : null,
  useLocation: () => ({ pathname: '/', state: null }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

test('renders tracker shell', async () => {
  render(<App />);
  expect(await screen.findByText(/ESPORTS TRACKER/i)).toBeInTheDocument();
});
