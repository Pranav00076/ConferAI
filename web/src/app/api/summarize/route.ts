import { NextResponse } from 'next';

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      // Fallback for when user hasn't configured Groq yet
      console.warn("GROQ_API_KEY is not set. Generating a fallback summary.");
      const fallbackSummary = transcript.length > 200 ? transcript.substring(0, 200) + '...' : transcript;
      return NextResponse.json({ summary: "⚠️ Please set your GROQ_API_KEY in .env.local to enable AI Intelligence.\n\nFallback Snippet:\n" + fallbackSummary });
    }

    const prompt = `You are a professional Executive Assistant. Analyze the following meeting transcript and provide a beautifully formatted Markdown response with three sections:
1. **Executive Summary**: A concise 2-3 sentence overview of the meeting.
2. **Key Action Items**: A bulleted list of tasks or next steps discussed. If none, state "No clear action items."
3. **Meeting Sentiment**: A one-sentence description of the overall tone (e.g., "Collaborative and productive", "Tense but resolved").

Transcript:
"""
${transcript}
"""`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Blazing fast and free
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API Error:", errorData);
      return NextResponse.json({ error: 'Failed to generate summary with Groq.' }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Failed to generate summary.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
