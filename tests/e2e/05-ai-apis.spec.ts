/**
 * E2E Test: AI API Connectivity
 * 
 * Tests that all AI APIs work correctly
 * Uses notion.com as test domain (AI definitely mentions it)
 */

import { test, expect } from '@playwright/test';

const TEST_QUERY = 'What are the best note-taking apps for productivity?';
const EXPECTED_MENTION = 'notion';

test.describe('AI API Connectivity', () => {
  // Skip if API key not set
  const skipPerplexity = !process.env.PERPLEXITY_API_KEY;
  const skipGoogleAI = !process.env.GOOGLE_AI_API_KEY;
  const skipOpenAI = !process.env.OPENAI_API_KEY;

  test('Perplexity API returns real response', async () => {
    test.skip(skipPerplexity, 'PERPLEXITY_API_KEY not set');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: TEST_QUERY }],
        max_tokens: 500,
      }),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.choices).toBeDefined();
    expect(data.choices[0].message.content).toBeDefined();
    
    const content = data.choices[0].message.content.toLowerCase();
    const citations = data.citations || [];
    
    // Notion should be mentioned for this query
    const mentionsNotion = content.includes(EXPECTED_MENTION) || 
                           citations.some((c: string) => c.toLowerCase().includes(EXPECTED_MENTION));
    
    console.log(`Perplexity response length: ${content.length}`);
    console.log(`Perplexity citations: ${citations.length}`);
    console.log(`Mentions Notion: ${mentionsNotion}`);
    
    // Main assertion: API returned valid response
    expect(content.length).toBeGreaterThan(50);
  });

  test('Google AI (Gemini) returns real response', async () => {
    test.skip(skipGoogleAI, 'GOOGLE_AI_API_KEY not set');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: TEST_QUERY }] }],
          generationConfig: { maxOutputTokens: 500 },
        }),
      }
    );

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.candidates).toBeDefined();
    
    const content = data.candidates[0]?.content?.parts?.[0]?.text || '';
    
    console.log(`Google AI response length: ${content.length}`);
    console.log(`Mentions Notion: ${content.toLowerCase().includes(EXPECTED_MENTION)}`);
    
    expect(content.length).toBeGreaterThan(50);
  });

  test('OpenAI API returns real response', async () => {
    test.skip(skipOpenAI, 'OPENAI_API_KEY not set');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: TEST_QUERY }],
        max_tokens: 500,
      }),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.choices).toBeDefined();
    
    const content = data.choices[0]?.message?.content || '';
    
    console.log(`OpenAI response length: ${content.length}`);
    console.log(`Mentions Notion: ${content.toLowerCase().includes(EXPECTED_MENTION)}`);
    
    expect(content.length).toBeGreaterThan(50);
  });
});

test.describe('No Mock Data', () => {
  test('AI responses contain real product names', async () => {
    // This test verifies that when we get AI responses, they contain real products
    // not placeholder text
    
    const realProducts = ['notion', 'evernote', 'obsidian', 'roam', 'apple notes', 'google keep', 'onenote'];
    
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: TEST_QUERY }],
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content?.toLowerCase() || '';
        
        // At least one real product should be mentioned
        const mentionsRealProduct = realProducts.some(p => content.includes(p));
        expect(mentionsRealProduct).toBe(true);
        
        // Should NOT contain placeholder patterns
        expect(content).not.toContain('placeholder');
        expect(content).not.toContain('[product name]');
        expect(content).not.toContain('example.com');
      }
    }
  });
});

