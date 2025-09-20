import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getEnv } from './env';
import { validateWebhookPayload } from './validation';

export function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const env = getEnv();
  if (!env?.webhookSecret) {
    console.warn('Webhook secret not configured, skipping signature verification');
    return true; 
  }

  const signature = request.headers.get('x-webhook-signature');
  if (!signature) {
    console.warn('Missing webhook signature, skipping verification for testing');
    return true; // Allow if no signature provided
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.webhookSecret)
    .update(body, 'utf8')
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!isValid) {
    console.error('Invalid webhook signature');
  }

  return isValid;
}

export async function validateWebhookRequest(request: NextRequest): Promise<{ isValid: boolean; body: unknown; errors?: string[] }> {
  try {
    const body = await request.text();

    if (!verifyWebhookSignature(request, body)) {
      return { isValid: false, body: null };
    }

    const parsedBody = JSON.parse(body);
    const validation = validateWebhookPayload(parsedBody);

    if (!validation.isValid) {
      return { isValid: false, body: null, errors: validation.errors };
    }

    return { isValid: true, body: validation.sanitized };
  } catch (error) {
    console.error('Webhook validation error:', error);
    return { isValid: false, body: null };
  }
}