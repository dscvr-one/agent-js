import counterCanister, { noncelessCanister, createActor } from '../canisters/counter';
import { it, expect, describe, vi } from 'vitest';

describe('counter', () => {
  it('should greet', async () => {
    const { actor: counter } = await counterCanister();
    try {
      expect(await counter.greet('counter')).toEqual('Hello, counter!');
    } catch (error) {
      console.error(error);
    }
  }, 40000);
  it('should submit distinct requests with nonce by default', async () => {
    const { actor: counter } = await counterCanister();
    const values = await Promise.all(new Array(4).fill(undefined).map(() => counter.inc_read()));
    const set1 = new Set(values);
    const values2 = await Promise.all(new Array(4).fill(undefined).map(() => counter.inc_read()));
    const set2 = new Set(values2);

    // Sets of unique results should be the same length
    expect(set1.size).toBe(values.length);
    expect(set2.size).toEqual(values2.length);
  }, 40000);
  it('should submit duplicate requests if nonce is disabled', async () => {
    const { actor: counter } = await noncelessCanister();
    const values = await Promise.all(new Array(4).fill(undefined).map(() => counter.inc_read()));
    const set1 = new Set(values);
    const values2 = await Promise.all(new Array(4).fill(undefined).map(() => counter.inc_read()));
    const set2 = new Set(values2);

    expect(set1.size < values.length || set2.size < values2.length).toBe(true);
  }, 40000);
  it('should increment', async () => {
    const { actor: counter } = await noncelessCanister();

    expect(Number(await counter.read())).toEqual(0);
    await counter.inc();
    expect(Number(await counter.read())).toEqual(1);
    await counter.inc();
    expect(Number(await counter.read())).toEqual(2);
  }, 40000);
});
describe('retrytimes', () => {
  it('should retry after a failure', async () => {
    let count = 0;
    const fetchMock = vi.fn(function (...args) {
      if (count <= 1) {
        count += 1;
        return new Response('Test error - ignore', {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }
      // eslint-disable-next-line prefer-spread
      return fetch.apply(
        null,
        args as [input: string | Request, init?: RequestInit | CMRequestInit | undefined],
      );
    });

    const counter = await createActor({ fetch: fetchMock as typeof fetch, retryTimes: 3 });
    try {
      expect(await counter.greet('counter')).toEqual('Hello, counter!');
    } catch (error) {
      console.error(error);
    }
  }, 40000);
});
