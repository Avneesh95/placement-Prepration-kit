import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { ThemeProvider, useTheme } from '../lib/theme';
import { ThemeToggle } from '../components/ThemeToggle';

function TestConsumer() {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="is-dark">{String(isDark)}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={toggleTheme}>Toggle</button>
      <ThemeToggle />
    </div>
  );
}

describe('Theme System', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  test('defaults to system theme and adapts to media query', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-val')).toHaveTextContent('system');
  });

  test('toggles theme between light and dark and updates document.documentElement', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Explicitly set dark
    await userEvent.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Explicitly set light
    await userEvent.click(screen.getByText('Set Light'));
    expect(screen.getByTestId('theme-val')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('ThemeToggle button toggles theme with accessible label', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
    expect(toggleBtn).toBeInTheDocument();

    await userEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
