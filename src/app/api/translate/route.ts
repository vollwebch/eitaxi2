import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const langNames: Record<string, string> = {
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  en: 'English',
  pt: 'Portuguese',
};

// In-memory cache to avoid re-translating the same messages
const translationCache = new Map<string, { text: string; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { success: false, error: 'Missing text or targetLang' },
        { status: 400 }
      );
    }

    const lang = langNames[targetLang] || targetLang;
    const cacheKey = `${text}::${lang}`;

    // Check cache
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ success: true, data: { translation: cached.text } });
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${lang}. Only output the translation, nothing else. Keep it natural and conversational. Do not add quotes or explanations.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const translation = completion.choices[0]?.message?.content?.trim();

    if (!translation) {
      return NextResponse.json(
        { success: false, error: 'Translation failed' },
        { status: 500 }
      );
    }

    // Save to cache
    translationCache.set(cacheKey, { text: translation, ts: Date.now() });

    // Clean old cache entries periodically
    if (translationCache.size > 500) {
      const now = Date.now();
      for (const [key, val] of translationCache.entries()) {
        if (now - val.ts > CACHE_TTL) {
          translationCache.delete(key);
        }
      }
    }

    return NextResponse.json({ success: true, data: { translation } });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { success: false, error: 'Error en la traduccion' },
      { status: 500 }
    );
  }
}
