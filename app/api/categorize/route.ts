import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items payload' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const prompt = `Categorize each item in the list into strictly one of four categories: 'Stationery', 'Electricals', 'Chemicals', or 'Food / Provisions'. Return ONLY a valid JSON object where keys are the 4 category names and values are arrays of item names. Items: ${JSON.stringify(items)}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return NextResponse.json({ error: 'Failed to fetch from Gemini API' }, { status: 500 });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: 'Invalid response from Gemini API' }, { status: 500 });
    }

    const parsed = JSON.parse(resultText);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('API /categorize Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
