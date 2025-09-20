import { supabase } from './supabase';
import { sanitizeString, isValidMedicalId } from './validation';

export interface PatientLookupResult {
  patientData: Record<string, unknown> | null;
  contextMessage: string;
}

export async function lookupPatient(from?: string, medicalId?: string): Promise<PatientLookupResult> {
  let patientData = null;
  let contextMessage = 'No patient data available. Please have the caller provide their medical ID during the conversation.';

  if (medicalId && isValidMedicalId(medicalId)) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('medical_id', medicalId.toUpperCase())
      .single();

    if (!error && data) {
      patientData = data;
      contextMessage = `Patient Information: Name: ${data.name}, Medical ID: ${data.medical_id}, Allergies: ${data.allergies || 'None reported'}, Current Medications: ${data.current_medications || 'None'}, Medical History: ${data.medical_history || 'No significant history'}, Last Call Summary: ${data.last_call_summary || 'No previous calls'}`;
      return { patientData, contextMessage };
    }
  }

  if (from) {
    const sanitizedPhone = sanitizeString(from);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', sanitizedPhone)
      .single();

    if (!error && data) {
      patientData = data;
      contextMessage = `Patient Information: Name: ${data.name}, Medical ID: ${data.medical_id}, Allergies: ${data.allergies || 'None reported'}, Current Medications: ${data.current_medications || 'None'}, Medical History: ${data.medical_history || 'No significant history'}, Last Call Summary: ${data.last_call_summary || 'No previous calls'}`;
      return { patientData, contextMessage };
    }
  }

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .limit(1)
    .single();

  if (!error && data) {
    patientData = data;
    contextMessage = `Example Patient Data (for demo): Name: ${data.name}, Medical ID: ${data.medical_id}. In a real scenario, verify patient identity during the call.`;
  }

  return { patientData, contextMessage };
}

export async function extractPatientIdFromCall(functionCalls: unknown[], transcript: string): Promise<string | null> {
  if (functionCalls && Array.isArray(functionCalls)) {
    const patientFunctionCall = functionCalls.find((call: unknown) =>
      call.function === 'fetch_patient' ||
      call.name === 'fetch_patient' ||
      (call.arguments && call.arguments.medical_id)
    );

    if (patientFunctionCall) {
      if (patientFunctionCall.arguments?.medical_id) {
        return sanitizeString(patientFunctionCall.arguments.medical_id).toUpperCase();
      }
      if (patientFunctionCall.arguments?.id) {
        return sanitizeString(patientFunctionCall.arguments.id).toUpperCase();
      }
    }
  }

  if (transcript) {
    const medicalIdMatch = transcript.match(/MED\d{3}/i);
    if (medicalIdMatch) {
      return medicalIdMatch[0].toUpperCase();
    }
  }

  return null;
}