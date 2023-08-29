import { HiddenNumberPipe } from './hidden-number.pipe';

describe('HiddenNumberPipe', () => {
  it('create an instance', () => {
    const pipe = new HiddenNumberPipe();
    expect(pipe).toBeTruthy();
  });
});
