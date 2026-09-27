import { afterEach, describe, expect, it } from 'vitest';
import { readApiKey } from '../src/config/env';

afterEach(() => {
    delete process.env.TEST_API_KEY;
});

describe('readApiKey', () => {
    it.each([
        ['abc123', 'abc123'],
        ['  abc123 \n', 'abc123'],
        ['"abc123"', 'abc123'],
        ["'abc123'", 'abc123'],
        [' "abc123" ', 'abc123'],
    ])('normalizes %j', (raw, expected) => {
        process.env.TEST_API_KEY = raw;
        expect(readApiKey('TEST_API_KEY')).toBe(expected);
    });

    it('returns undefined for missing or blank keys', () => {
        expect(readApiKey('TEST_API_KEY')).toBeUndefined();
        process.env.TEST_API_KEY = '   ';
        expect(readApiKey('TEST_API_KEY')).toBeUndefined();
    });
});
