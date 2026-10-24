import { describe, expect, it } from 'vitest';
import { uniqueChannelName } from './channelName';

describe('uniqueChannelName', () => {
  it('começa pelo prefixo e traz um sufixo', () => {
    expect(uniqueChannelName('session_abc')).toMatch(/^session_abc_.+/);
  });

  it('duas chamadas com o mesmo prefixo dão nomes diferentes', () => {
    expect(uniqueChannelName('x')).not.toBe(uniqueChannelName('x'));
  });
});
