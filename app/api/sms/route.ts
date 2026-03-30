import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// POST — send SMS to parent
export async function POST(req: NextRequest) {
  try {
    const { to, message } = (await req.json()) as { to?: string; message?: string };
    if (!to || !message) {
      return NextResponse.json({ error: 'Missing to or message' }, { status: 400 });
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER!,
      to,
    });
    return NextResponse.json({ success: true, sid: result.sid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send SMS';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — Twilio webhook receives parent SMS reply (H or C)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const body = searchParams.get('Body')?.trim().toLowerCase() ?? '';

  let sentiment = 'unknown';
  if (['h', 'haan', 'han', 'yes', 'happy'].includes(body)) {
    sentiment = 'happy';
  }
  if (['c', 'concern', 'no', 'nahi', 'nahi'].includes(body)) {
    sentiment = 'concern';
  }

  const autoReply =
    sentiment === 'happy'
      ? 'Bahut shukriya! Aapki beti ki progress record ho gayi. 🌟'
      : sentiment === 'concern'
        ? 'Shukriya batane ke liye. Hamara coordinator aapse jald contact karega.'
        : 'Please H bhejo agar khush hain, ya C bhejo agar concern hai.';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response><Message>${autoReply}</Message></Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

