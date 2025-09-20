import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from './env';

export function authenticateRequest(request: NextRequest): boolean {
  const env = getEnv();
  if (!env?.apiKey) {
    console.warn('API key not configured, skipping authentication');
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    console.error('Missing authorization header');
    return false;
  }

  const expectedAuth = `Bearer ${env.apiKey}`;
  const isValid = authHeader === expectedAuth;

  if (!isValid) {
    console.error('Invalid API key');
  }

  return isValid;
}

export type ApiHandler = (request: NextRequest, context: unknown) => Promise<NextResponse> | NextResponse;

export function requireAuth(handler: ApiHandler) {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    if (!authenticateRequest(request)) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    return handler(request, context);
  };
}