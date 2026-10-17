import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual('../lib/api');
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
import { api } from '../lib/api';
import { AuthProvider } from '../lib/auth';
import { Login } from '../pages/Auth';
import TestRunner from '../pages/TestRunner';
import QuestionCard from '../components/QuestionCard';

const payload = (over = {}) => ({
  attemptId: 'att1', status: 'in_progress', serverNow: new Date().toISOString(), deadline: new Date(Date.now() + 25 * 60 * 1000).toISOString(), currentSection: null, sectionDeadlines: [],
  test: { title: 'Demo Mock', sectionTimed: false }, sectionTimed: false, answers: {},
  sections: [{ index: 0, name: 'Aptitude', subject: 'aptitude', locked: false, questions: [
    { _id: 'q1', type: 'mcq_single', text: 'What is 10% of 50?', options: ['4', '5', '6', '7'], topic: 'percentages', marks: 1, negativeMarks: 0.25 },
    { _id: 'q2', type: 'numeric', text: 'Type 7', topic: 'algebra', marks: 1, negativeMarks: 0 },
  ] }], ...over,
});
const renderRunner = () => render(<MemoryRouter initialEntries={['/attempt/att1']}><Routes><Route path="/attempt/:id" element={<TestRunner />} /><Route path="/results/:id" element={<div>RESULT PAGE</div>} /></Routes></MemoryRouter>);

beforeEach(() => { vi.clearAllMocks(); api.put.mockResolvedValue({ saved: 1, rejected: [] }); api.post.mockResolvedValue({ status: 'submitted' }); });

describe('TestRunner', () => {
  test('shows the server-based countdown, question, and palette; selecting saves to the server', async () => {
    api.get.mockResolvedValue(payload()); renderRunner();
    expect(await screen.findByText('What is 10% of 50?')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent(/2[45]:\d\d/);
    expect(screen.getAllByRole('button', { name: /^Question \d/ }).length).toBeGreaterThanOrEqual(2);
    await userEvent.click(screen.getByRole('radio', { name: /B\s*5/ }));
    expect(screen.getByRole('radio', { name: /B\s*5/ })).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(api.put).toHaveBeenCalled(), { timeout: 3000 });
    const body = api.put.mock.calls[0][1].answers[0];
    expect(body).toMatchObject({ questionId: 'q1', response: [1] });
    expect(JSON.stringify(api.put.mock.calls)).not.toMatch(/correct/);
  });
  test('mark for review is reflected in the palette and saved', async () => {
    api.get.mockResolvedValue(payload()); renderRunner();
    await screen.findByText('What is 10% of 50?');
    await userEvent.click(screen.getByRole('button', { name: /mark for review/i }));
    expect(screen.getByRole('button', { name: 'Question 1: marked' })).toBeInTheDocument();
    await waitFor(() => expect(api.put.mock.calls.some((c) => c[1].answers[0].markedForReview === true)).toBe(true), { timeout: 3000 });
  });
  test('submit shows a confirmation with counts, then submits and goes to the result', async () => {
    api.get.mockResolvedValue(payload()); renderRunner();
    await screen.findByText('What is 10% of 50?');
    await userEvent.click(screen.getByRole('radio', { name: /A\s*4/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent(/answered 1 of 2/);
    await userEvent.click(screen.getAllByRole('button', { name: 'Submit' }).pop());
    await waitFor(() => expect(api.post.mock.calls.some((c) => c[0] === '/attempts/att1/submit')).toBe(true), { timeout: 5000 });
    expect(await screen.findByText('RESULT PAGE')).toBeInTheDocument();
  });
  test('auto-submits when the server deadline has passed', async () => {
    api.get.mockResolvedValue(payload({ deadline: new Date(Date.now() - 5000).toISOString() })); renderRunner();
    await waitFor(() => expect(api.post.mock.calls.some((c) => c[0] === '/attempts/att1/submit')).toBe(true), { timeout: 5000 });
    expect(await screen.findByText('RESULT PAGE')).toBeInTheDocument();
  });
  test('an already-submitted attempt goes straight to results (refresh after submit)', async () => {
    api.get.mockResolvedValue({ attemptId: 'att1', status: 'submitted', serverNow: new Date().toISOString() }); renderRunner();
    expect(await screen.findByText('RESULT PAGE')).toBeInTheDocument();
  });
  test('a locked section cannot be edited', async () => {
    const p = payload(); p.sections[0].locked = true; api.get.mockResolvedValue(p); renderRunner();
    await screen.findByText(/section has ended/i);
    expect(screen.getByRole('radio', { name: /A\s*4/ })).toBeDisabled();
  });
});

describe('Login', () => {
  test('shows server errors and logs in', async () => {
    api.get.mockRejectedValue(new Error('no session'));
    api.post.mockRejectedValueOnce(Object.assign(new Error('Email or password is incorrect.'), { code: 'BAD_CREDENTIALS' }));
    render(<MemoryRouter initialEntries={['/login']}><AuthProvider><Login /></AuthProvider></MemoryRouter>);
    await userEvent.type(await screen.findByLabelText('Email'), 'a@b.co'); await userEvent.type(screen.getByLabelText('Password'), 'wrongpass1');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });
});

describe('QuestionCard (practice)', () => {
  const q = { _id: 'p1', type: 'mcq_single', topic: 'percentages', difficulty: 'easy', provenance: 'practice', text: 'Pick B', options: ['A1', 'B1', 'C1', 'D1'], userState: {} };
  test('labels provenance, grades via the server and shows the explanation', async () => {
    api.post.mockResolvedValue({ correct: false, correctOptions: [2], explanation: 'Because C.', sourceTitle: 'Original practice question', verificationStatus: 'original' });
    render(<QuestionCard q={q} />);
    expect(screen.getByText('Practice question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: /B\s*B1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(await screen.findByText('Because C.')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/questions/p1/answer', expect.objectContaining({ response: [1] }));
  });
  test('bookmark toggles', async () => {
    api.post.mockResolvedValue({ bookmarked: true }); render(<QuestionCard q={q} />);
    await userEvent.click(screen.getByRole('button', { name: /bookmark question/i }));
    expect(api.post.mock.calls.some((c) => c[0] === '/bookmarks/p1')).toBe(true); expect(await screen.findByRole('button', { name: /remove bookmark/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
