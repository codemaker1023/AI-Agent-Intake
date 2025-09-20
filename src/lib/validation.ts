import { NextRequest, NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';

// Sanitize string inputs
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input.trim());
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

// Validate medical ID format
export function isValidMedicalId(id: string): boolean {
  const medicalIdRegex = /^MED\d{3}$/;
  return medicalIdRegex.test(id);
}

// Sanitize and validate webhook payload
export function validateWebhookPayload(body: unknown): { isValid: boolean; sanitized: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  // Common fields for both pre-call and post-call
  if (body.call_id) {
    sanitized.call_id = sanitizeString(body.call_id);
  }

  if (body.bot_id) {
    sanitized.bot_id = sanitizeString(body.bot_id);
  }

  // for pre-call
  if (body.from) {
    sanitized.from = sanitizeString(body.from);
    if (!isValidPhone(sanitized.from)) {
      errors.push('Invalid phone number format');
    }
  }

  if (body.to) {
    sanitized.to = sanitizeString(body.to);
  }

  // For post-call
  if (body.transcript) {
    sanitized.transcript = sanitizeString(body.transcript);
  }

  if (body.summary) {
    sanitized.summary = sanitizeString(body.summary);
  }

  if (body.duration !== undefined) {
    const duration = Number(body.duration);
    if (isNaN(duration) || duration < 0) {
      errors.push('Invalid duration');
    } else {
      sanitized.duration = duration;
    }
  }

  if (body.status) {
    sanitized.status = sanitizeString(body.status);
  }

  if (body.metadata) {
    sanitized.metadata = body.metadata; // Assuming metadata is an object, no sanitization needed
  }

  if (body.function_calls) {
    sanitized.function_calls = body.function_calls; // Assuming it's an array or object
  }

  if (body.patient_id) {
    sanitized.patient_id = sanitizeString(body.patient_id);
    if (!isValidMedicalId(sanitized.patient_id)) {
      errors.push('Invalid medical ID format');
    }
  }

  if (body.medical_id) {
    sanitized.medical_id = sanitizeString(body.medical_id);
    if (!isValidMedicalId(sanitized.medical_id)) {
      errors.push('Invalid medical ID format');
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
}

// Middleware function for input validation
export async function validateRequest(request: NextRequest): Promise<{ isValid: boolean; body: unknown; response?: NextResponse }> {
  try {
    const body = await request.json();
    const validation = validateWebhookPayload(body);

    if (!validation.isValid) {
      return {
        isValid: false,
        body: null,
        response: NextResponse.json({
          error: 'Validation failed',
          details: validation.errors
        }, { status: 400 })
      };
    }

    return {
      isValid: true,
      body: validation.sanitized
    };
  } catch (error) {
    return {
      isValid: false,
      body: null,
      response: NextResponse.json({
        error: 'Invalid JSON payload'
      }, { status: 400 })
    };
  }
}