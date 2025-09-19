import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100;
const WINDOW_MS = 15 * 60 * 1000;

export function checkRateLimit(request: NextRequest): { allowed: boolean; response?: NextResponse } {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const now = Date.now();
  const windowKey = `${ip}:${Math.floor(now / WINDOW_MS)}`;

  const current = rateLimitMap.get(windowKey) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + WINDOW_MS;
  }

  current.count++;
  rateLimitMap.set(windowKey, current);

  if (current.count > RATE_LIMIT) {
    const resetTime = new Date(current.resetTime);
    return {
      allowed: false,
      response: NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toISOString()
        }
      })
    };
  }

  return { allowed: true };
}

export function withRateLimit(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    return handler(request, ...args);
  };
}