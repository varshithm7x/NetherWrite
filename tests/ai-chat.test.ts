import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/utils/ai-settings', () => ({ loadAIConfig: () => ({ provider: 'openrouter', modelId: 'test-model', apiKey: 'test-key' }), getBaseUrl: () => 'https://openrouter.ai/api/v1', getProviderHeaders: () => ({ Authorization: 'Bearer test-key' }), parseProviderError: async () => 'Provider unavailable' }));
vi.mock('../src/utils/ai-core', () => ({ askAI: vi.fn(async () => '# Generated note\n\nUseful content.') }));
import { answerChat, extractWebSources, noteFilename, wantsNote } from '../src/utils/ai-chat';
describe('AI chat actions and web sources', () => {
  it('recognizes note creation requests without treating ordinary questions as writes', () => { expect(wantsNote('Create a note about semantic search')).toBe(true); expect(wantsNote('Generate markdown notes from this PDF')).toBe(true); expect(wantsNote('Explain the ideas in my notes')).toBe(false); });
  it('sanitizes generated note titles to a single safe filename', () => { expect(noteFilename('# ../Bad: path/file')).not.toMatch(/[/:]/); expect(noteFilename('No heading')).toBe('AI research note'); });
  it('accepts verified web annotations, rejects unsafe schemes, and deduplicates URLs', () => { const data = { choices: [{ message: { annotations: [{ url_citation: { url: 'https://example.com/paper', title: 'A paper' } }, { url_citation: { url: 'javascript:alert(1)' } }, { url_citation: { url: 'https://example.com/paper', title: 'A paper' } }] } }] }; expect(extractWebSources(data)).toEqual([{ url: 'https://example.com/paper', title: 'A paper' }]); });
  it('enables the provider web search tool and keeps its returned references', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'A sourced answer', annotations: [{ type: 'url_citation', url_citation: { url: 'https://example.com/research', title: 'Research' } }] } }] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);
    try { const answer = await answerChat('Find internet references', [], '', true, false); const request = JSON.parse(fetcher.mock.calls[0][1].body); expect(request.tools[0].type).toBe('openrouter:web_search'); expect(answer.webSources[0].url).toBe('https://example.com/research'); } finally { vi.unstubAllGlobals(); }
  });
});
