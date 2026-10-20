import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { animateRoll } from './rollAnimation';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const options = (over: Partial<Parameters<typeof animateRoll>[0]> = {}) => ({
  duration: 1000,
  minInterval: 100,
  maxInterval: 300,
  onTick: vi.fn(),
  onFinish: vi.fn(),
  isActive: () => true,
  ...over,
});

describe('animateRoll', () => {
  it('mostra o primeiro número na hora, sem esperar', () => {
    const o = options();
    animateRoll(o);
    expect(o.onTick).toHaveBeenCalledTimes(1);
    expect(o.onFinish).not.toHaveBeenCalled();
  });

  it('desacelera: cada intervalo é maior que o anterior', () => {
    const o = options();
    const times: number[] = [];
    o.onTick = vi.fn(() => times.push(Date.now()));
    const start = Date.now();
    animateRoll(o);
    vi.advanceTimersByTime(5000);
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    expect(gaps.length).toBeGreaterThan(2);
    expect(gaps[0]).toBe(100); // progresso 0: intervalo mínimo
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThanOrEqual(gaps[i - 1]);
    expect(times[0] - start).toBe(0);
  });

  it('termina uma vez, só depois da duração, e para de sortear', () => {
    const o = options();
    animateRoll(o);
    vi.advanceTimersByTime(900);
    expect(o.onFinish).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(o.onFinish).toHaveBeenCalledTimes(1);
    const ticks = vi.mocked(o.onTick).mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(vi.mocked(o.onTick).mock.calls.length).toBe(ticks);
  });

  it('para sem terminar quando a tela deixa de estar ativa', () => {
    let active = true;
    const o = options({ isActive: () => active });
    animateRoll(o);
    active = false;
    vi.advanceTimersByTime(5000);
    expect(o.onTick).toHaveBeenCalledTimes(1);
    expect(o.onFinish).not.toHaveBeenCalled();
  });

  it('não começa se já está inativa', () => {
    const o = options({ isActive: () => false });
    animateRoll(o);
    expect(o.onTick).not.toHaveBeenCalled();
  });
});
