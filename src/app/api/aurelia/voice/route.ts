export const dynamic = 'force-dynamic';

/**
 * Aurelia Voice API — Speech-to-text and text-to-speech
 * POST /api/aurelia/voice — Send audio, get text transcription + AI response + audio response
 * POST /api/aurelia/voice?action=tts — Convert text to speech (ElevenLabs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withMobileGuard } from '@/lib/mobile-guard';
import { logger } from '@/lib/logger';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9'; // Jessica — Playful, Bright, Warm (young female, conversational)

/**
 * POST — Process voice input or generate voice output
 */
export const POST = withMobileGuard(async (request, { session }) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // TTS: Convert text to speech
    if (action === 'tts') {
      const body = await request.json();
      const text = body.text;
      if (!text) {
        return NextResponse.json({ error: 'text is required' }, { status: 400 });
      }

      const audioBuffer = await textToSpeech(text);
      if (!audioBuffer) {
        return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
      }

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
        },
      });
    }

    // STT: Transcribe audio to text
    const contentType = request.headers.get('content-type') || '';

    let audioData: ArrayBuffer;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('audio') as File;
      if (!file) {
        return NextResponse.json({ error: 'audio file is required' }, { status: 400 });
      }
      audioData = await file.arrayBuffer();
    } else {
      audioData = await request.arrayBuffer();
    }

    if (!audioData || audioData.byteLength === 0) {
      return NextResponse.json({ error: 'Empty audio data' }, { status: 400 });
    }

    // Transcribe with Deepgram
    const transcription = await speechToText(audioData);
    if (!transcription) {
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    logger.info('[Aurelia Voice] Transcription', {
      userId: session.user.id,
      text: transcription.substring(0, 100),
    });

    return NextResponse.json({
      text: transcription,
      confidence: 1.0,
    });
  } catch (error) {
    logger.error('[Aurelia Voice] POST failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Voice processing failed' }, { status: 500 });
  }
});

/**
 * Deepgram Speech-to-Text
 */
async function speechToText(audioData: ArrayBuffer): Promise<string | null> {
  if (!DEEPGRAM_API_KEY) {
    logger.error('[Aurelia Voice] DEEPGRAM_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=fr&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/wav',
      },
      body: audioData,
    });

    if (!response.ok) {
      logger.error('[Aurelia Voice] Deepgram error', { status: response.status });
      return null;
    }

    const data = await response.json();
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    return transcript || null;
  } catch (err) {
    logger.error('[Aurelia Voice] Deepgram call failed', { error: String(err) });
    return null;
  }
}

/**
 * ElevenLabs Text-to-Speech
 */
async function textToSpeech(text: string): Promise<ArrayBuffer | null> {
  if (!ELEVENLABS_API_KEY) {
    logger.error('[Aurelia Voice] ELEVENLABS_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      logger.error('[Aurelia Voice] ElevenLabs error', { status: response.status });
      return null;
    }

    return await response.arrayBuffer();
  } catch (err) {
    logger.error('[Aurelia Voice] ElevenLabs call failed', { error: String(err) });
    return null;
  }
}
