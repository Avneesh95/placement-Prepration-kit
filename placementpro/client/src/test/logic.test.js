import { remainingSeconds, paletteState, summarise } from '../lib/testState';
import { mmss, label, pct } from '../lib/format';
import { validateRegister } from '../pages/Auth';

describe('timer maths', () => {
  test('uses the server clock offset, not the device clock', () => {
    const deadline = new Date(1_000_000 + 600_000).toISOString();
    expect(remainingSeconds(deadline, 0, 1_000_000)).toBe(600);
    // device clock runs 2 minutes behind the server -> offset +120000 -> less time left
    expect(remainingSeconds(deadline, 120_000, 1_000_000)).toBe(480);
    expect(remainingSeconds(deadline, 0, 5_000_000)).toBe(0);
  });
  test('mm:ss and h:mm:ss formatting', () => { expect(mmss(65)).toBe('01:05'); expect(mmss(3725)).toBe('1:02:05'); expect(mmss(-4)).toBe('00:00'); });
});
describe('question palette', () => {
  test('states', () => {
    expect(paletteState(undefined)).toBe('fresh');
    expect(paletteState({ visited: true })).toBe('visited');
    expect(paletteState({ response: [1] })).toBe('answered');
    expect(paletteState({ response: [] , visited: true })).toBe('visited');
    expect(paletteState({ markedForReview: true })).toBe('marked');
    expect(paletteState({ markedForReview: true, response: '5' })).toBe('marked-answered');
  });
  test('summary counts', () => {
    const qs = [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }];
    expect(summarise(qs, { a: { response: [0] }, b: { markedForReview: true } })).toEqual({ total: 3, answered: 1, unanswered: 2, marked: 1 });
  });
});
test('formatting helpers', () => { expect(label('profit-loss')).toBe('Profit Loss'); expect(pct(null)).toBe('—'); expect(pct(66.666)).toBe('66.7%'); });
test('registration validation', () => {
  expect(Object.keys(validateRegister({ name: '', email: 'x', password: '123', graduationYear: 1999 })).sort()).toEqual(['email', 'graduationYear', 'name', 'password']);
  expect(validateRegister({ name: 'Asha K', email: 'a@b.co', password: 'abcdefg1', graduationYear: 2027 })).toEqual({});
  expect(validateRegister({ name: 'Asha K', email: 'a@b.co', password: 'abcdefgh', graduationYear: 2027 }).password).toMatch(/number/);
});
