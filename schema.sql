-- Create patients table for Medical domain
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  blood_type TEXT,
  allergies TEXT,
  current_medications TEXT,
  medical_history TEXT,
  recent_visits JSONB, -- Array of recent visit summaries
  upcoming_appointments JSONB, -- Array of upcoming appointments
  insurance_info TEXT,
  last_call_summary TEXT,
  last_call_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medications table
CREATE TABLE medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  prescribed_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name TEXT,
  specialty TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  status TEXT DEFAULT 'scheduled', 
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bots table
CREATE TABLE bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL, -- OpenMic bot UID
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'medical',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_logs table
CREATE TABLE call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  call_sid TEXT, -- OpenMic call identifier
  transcript TEXT,
  summary TEXT,
  duration INTEGER, -- in seconds
  status TEXT, -- completed, failed, etc.
  metadata JSONB, -- additional call data
  function_calls JSONB, -- log of API function calls made during call
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample patient data
INSERT INTO patients (medical_id, name, date_of_birth, phone, email, allergies, current_medications, medical_history, last_call_summary) VALUES
('MED001', 'John Doe', '1980-05-15', '+1234567890', 'john.doe@email.com', 'Penicillin', 'Lisinopril 10mg daily, Metformin 500mg twice daily', 'Hypertension diagnosed 2015, Type 2 Diabetes diagnosed 2018', 'Last call: Follow-up on medication adherence, patient reported good compliance'),
('MED002', 'Jane Smith', '1975-03-22', '+1234567891', 'jane.smith@email.com', 'None', 'Albuterol inhaler as needed', 'Asthma since childhood, well-controlled', 'Last call: Inquired about inhaler usage, patient doing well'),
('MED003', 'Bob Johnson', '1990-11-08', '+1234567892', 'bob.johnson@email.com', 'Shellfish', 'Ibuprofen 400mg as needed', 'Chronic back pain from injury 2020', 'Last call: Scheduled physical therapy appointment');

-- Insert sample medications
INSERT INTO medications (patient_id, name, dosage, frequency, prescribed_date, notes) VALUES
((SELECT id FROM patients WHERE medical_id = 'MED001'), 'Lisinopril', '10mg', 'Once daily', '2023-01-15', 'For hypertension'),
((SELECT id FROM patients WHERE medical_id = 'MED001'), 'Metformin', '500mg', 'Twice daily', '2023-02-01', 'For diabetes'),
((SELECT id FROM patients WHERE medical_id = 'MED002'), 'Albuterol', '90mcg', 'As needed', '2022-06-10', 'For asthma');

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_name, specialty, appointment_date, reason, status) VALUES
((SELECT id FROM patients WHERE medical_id = 'MED001'), 'Dr. Sarah Wilson', 'Cardiology', '2024-10-15 10:00:00+00', 'Hypertension follow-up', 'scheduled'),
((SELECT id FROM patients WHERE medical_id = 'MED003'), 'Dr. Michael Chen', 'Orthopedics', '2024-10-20 14:00:00+00', 'Back pain evaluation', 'scheduled');