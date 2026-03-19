export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

/**
 * Temporary debug endpoint to test Telnyx API connectivity from Azure.
 * DELETE THIS after debugging is complete.
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      TELNYX_API_KEY: process.env.TELNYX_API_KEY ? `${process.env.TELNYX_API_KEY.slice(0, 10)}...` : 'MISSING',
      TELNYX_CONNECTION_ID: process.env.TELNYX_CONNECTION_ID || 'MISSING',
    },
  };

  // Test 1: Can we reach Telnyx API?
  try {
    const resp = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=1', {
      headers: { 'Authorization': `Bearer ${process.env.TELNYX_API_KEY}` },
    });
    results.telnyxApiReachable = resp.ok;
    results.telnyxApiStatus = resp.status;
    if (!resp.ok) {
      results.telnyxApiError = (await resp.text()).slice(0, 200);
    }
  } catch (err) {
    results.telnyxApiReachable = false;
    results.telnyxApiError = err instanceof Error ? err.message : String(err);
  }

  // Test 2: Try a fake answerCall to see exact error
  try {
    const resp = await fetch('https://api.telnyx.com/v2/calls/v3:fake-debug-test/actions/answer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const body = await resp.json();
    results.answerCallTest = {
      status: resp.status,
      body,
    };
  } catch (err) {
    results.answerCallTest = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(results);
}
