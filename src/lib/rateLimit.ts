import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (works without Redis for development)
// For production with multiple instances, configure Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  limit: number;      // Max requests
  windowMs: number;   // Time window in milliseconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Stricter limits for write operations
  'POST:/api/registrations': { limit: 20, windowMs: 60000 },  // 20 per minute
  'POST:/api/events': { limit: 10, windowMs: 60000 },         // 10 per minute
  'PUT:/api/registrations': { limit: 30, windowMs: 60000 },   // 30 per minute
  'DELETE:/api/registrations': { limit: 10, windowMs: 60000 },// 10 per minute
  // More relaxed for read operations
  'GET:/api/registrations': { limit: 100, windowMs: 60000 },  // 100 per minute
  'GET:/api/events': { limit: 100, windowMs: 60000 },         // 100 per minute
  // Default
  'default': { limit: 60, windowMs: 60000 },                  // 60 per minute
};

function getClientIp(request: NextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

export function checkRateLimit(request: NextRequest, path: string): { success: boolean; remaining: number } {
  const ip = getClientIp(request);
  const method = request.method;
  const key = `${ip}:${method}:${path}`;
  
  // Get config for this endpoint or default
  const configKey = `${method}:${path}`;
  const config = RATE_LIMITS[configKey] || RATE_LIMITS['default'];
  
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  // Clean up old entries periodically (every 100 calls)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }
  }
  
  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { success: true, remaining: config.limit - 1 };
  }
  
  if (entry.count >= config.limit) {
    return { success: false, remaining: 0 };
  }
  
  entry.count++;
  return { success: true, remaining: config.limit - entry.count };
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { 
      status: 429,
      headers: {
        'Retry-After': '60',
      }
    }
  );
}

// Helper to wrap API handlers with rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  path: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { success } = checkRateLimit(request, path);
    if (!success) {
      return rateLimitResponse();
    }
    return handler(request);
  };
}
