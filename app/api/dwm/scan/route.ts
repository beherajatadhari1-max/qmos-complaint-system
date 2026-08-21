export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT = `You are a Quality Management AI. Analyse this photo from a factory morning meeting board.

Extract all tasks/action items written on the board. The board is organised by department (e.g. Production, Quality, Maintenance, Stores, HR, EHS, Planning, Engineering, Dispatch, etc.).

Return ONLY a valid JSON array — no markdown, no explanation — in this exact format:
[
  {
    "department": "Production",
    "dept_code": "PR",
    "tasks": [
      { "task_text": "Line 3 scrap report by 12 PM", "frequency": "D" },
      { "task_text": "TPM checklist update", "frequency": "D" }
    ]
  },
  {
    "department": "Quality",
    "dept_code": "QA",
    "tasks": [
      { "task_text": "PFMEA update part 2241", "frequency": "W" }
    ]
  }
]

Rules:
- frequency must be "D" (Daily), "W" (Weekly), or "M" (Monthly). Default to "D" if unclear.
- dept_code: 2-letter abbreviation — PR=Production, QA=Quality, MN=Maintenance, ST=Stores, HR=HR, EH=EHS, PL=Planning, EN=Engineering, DI=Dispatch, FI=Finance. Guess from context if not obvious.
- Clean up handwriting — fix obvious spelling, expand abbreviations.
- Include Issue Description, Action Plan, and Responsible person in the task_text where visible.
- If no department heading is visible, group tasks under "General".
- Return empty array [] if no tasks found.`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg', sessionDate } = await req.json() as {
      imageBase64: string;
      mimeType?: string;
      sessionDate?: string;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Call Gemini Vision via REST API
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
            { text: PROMPT },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[DWM Scan] Gemini error:', errText);
      return NextResponse.json({ error: `Gemini API error: ${geminiRes.status} — ${errText}` }, { status: 500 });
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let departments: Array<{
      department: string;
      dept_code: string;
      tasks: Array<{ task_text: string; frequency: string }>;
    }> = [];

    try {
      departments = JSON.parse(jsonStr);
    } catch {
      console.error('[DWM Scan] JSON parse failed:', jsonStr);
      return NextResponse.json({ error: 'AI could not extract tasks from this image. Please try a clearer photo.' }, { status: 422 });
    }

    // Save session to DB
    const db = getDB();
    const date = sessionDate ?? new Date().toISOString().slice(0, 10);
    const sess = db.prepare(
      'INSERT INTO dwm_sessions (session_date, photo_data) VALUES (?, ?)'
    ).run(date, imageBase64.slice(0, 500));
    const sessionId = sess.lastInsertRowid as number;

    return NextResponse.json({ sessionId, date, departments });
  } catch (err) {
    console.error('[DWM Scan]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
