export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: string;
  notes: string;
  initialHistory: string;
  defaultSessionValue: number; // Added: Default value per session for this patient
  totalPaid: number; // Added: Total value received from patient
  guardianName?: string; // Added: Legal guardian/Responsible adult
  guardianContact?: string; // Added: Guardian's contact
  medications?: string; // Added: Medication usage and which medicines
  cpf?: string; // Added: CPF for receipts
  address?: string; // Added: Address for receipts
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  dateTime: string;
  type: 'online' | 'presencial';
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending_payment';
  isConfirmed: boolean; // Added: WhatsApp confirmation status
  isPaid: boolean; // Added: Payment status
  price: number;
  notes?: string;
  userId: string;
  recurrence?: 'none' | 'weekly' | 'biweekly';
  seriesId?: string;
}

export interface SessionRecord {
  id: string;
  patientId: string;
  appointmentId: string;
  date: string;
  clinicalNotes: string;
  evolution: string; // 1-10 or text
  sessionValue: number; // Added: Individual session value
  userId: string;
}

export interface FinanceReport {
  period: string;
  totalFaturado: number;
  consultasRealizadas: number;
  consultasPendentes: number;
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  date: string;
  category: 'aluguel' | 'marketing' | 'supervisao' | 'outros';
  userId: string;
}

export interface ClinicSettings {
  clinicName: string;
  professionalName: string;
  professionalInitials: string;
  specialty: string;
  defaultSessionValue: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'member';
  status: 'authorized' | 'pending' | 'blocked';
  createdAt: string;
}
