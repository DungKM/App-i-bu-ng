
// --- RX INBOX & VERSIONING ---
export const RxChangeType = {
  ADD: 'ADD',       // Y lệnh mới
  UPDATE: 'UPDATE', // Sửa y lệnh (liều, cách dùng)
  STOP: 'STOP',     // Ngưng y lệnh
  NO_CHANGE: 'NO_CHANGE'
} as const;

export type RxChangeType = typeof RxChangeType[keyof typeof RxChangeType];

export interface RxInboxItem {
  patientId: string;
  patientName: string;
  patientCode: string;
  hisVersionId: string;
  hisTimestamp: string;
  currentVersionId: string;
  changes: RxChangeDetail[];
  status: 'PENDING' | 'APPLIED' | 'REJECTED'; 
  
  alerts?: {
      level: 'WARNING' | 'CRITICAL';
      message: string;
  }[];
}

export interface RxChangeDetail {
  id: string;
  orderId: string;
  type: RxChangeType;
  drugName: string;
  oldData?: {
    dosage: string;
    route: string;
    frequency: string;
  };
  newData?: {
    dosage: string;
    route: string;
    frequency: string;
    note?: string;
  };
  validationErrors?: string[];
  conflicts?: string[]; 
  acknowledged?: boolean;
}

// --- CORE TYPES ---
export enum UserRole {
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE'
}

export enum PatientStatus {
  STABLE = 'STABLE',
  CRITICAL = 'CRITICAL',
  DISCHARGING = 'DISCHARGING'
}

/* Fix: Missing TreatmentStatus enum used in Patient and Treatment modules */
export enum TreatmentStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  BATCH_PASSED = 'BATCH_PASSED',
  PENDING = 'PENDING',
  FINISHED = 'FINISHED',
  DISCHARGED = 'DISCHARGED'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

// Cập nhật 3 trạng thái dùng thuốc chính
export interface MedicationTodayStats {
  total: number;
  done: number;
  overdue: number;
  /* Fix: Add 'OVERDUE' to allowed status values */
  status: 'DONE' | 'PENDING' | 'NONE' | 'OVERDUE'; 
}

export interface Patient {
  id: string;
  code: string;
  name: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  room: string;
  bed: string;
  diagnosis: string;
  admissionDate: string;
  status: PatientStatus;
  insurance: boolean;
  medicationToday?: MedicationTodayStats;
  isSpecialCare?: boolean;
}

// --- NEWS2 SCORE TYPES ---
export interface NEWS2Result {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  color: string;
  recommendation: string;
}

// --- MEDICATION & MAR ---
export enum MARStatus {
  SCHEDULED = 'SCHEDULED',
  PREPARED = 'PREPARED',
  ADMINISTERED = 'ADMINISTERED',
  HELD = 'HELD',
  REFUSED = 'REFUSED',
  MISSED = 'MISSED',
  RETURN_PENDING = 'RETURN_PENDING',
  RETURNED = 'RETURNED'
}

/* Fix: Missing MedVisitStatus enum */
export enum MedVisitStatus {
  NEW = 'NEW',
  PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED',
  FULLY_DISPENSED = 'FULLY_DISPENSED'
}

/* Fix: Missing MedVisit interface */
export interface MedVisit {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientGender: string;
  deptCode: string;
  admissionDate: string;
  status: MedVisitStatus;
  marSummary?: {
    total: number;
    pending: number;
    missed: number;
    returnPending: number;
  };
}

/* Fix: Missing MedGroupStatus enum */
export enum MedGroupStatus {
  NEW = 'NEW',
  RELEASED = 'RELEASED',
  DISPENSED = 'DISPENSED'
}

/* Fix: Missing MedOrderStatus enum */
export enum MedOrderStatus {
  NEW = 'NEW',
  DISPENSED = 'DISPENSED'
}

export enum ShiftType {
  MORNING = 'MORNING',
  NOON = 'NOON',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT'
}

export interface MARItem {
  id: string;
  visitId: string;
  patientId: string;
  orderId: string;
  drugName: string;
  dosage: string;
  route: string;
  scheduledTime: string;
  shift: ShiftType;
  status: MARStatus;
  administeredAt?: string;
  administeredBy?: string;
  reasonCode?: string;
  note?: string;
  proof?: MedicationDeliveryProof;
  requiresScan: boolean;
}

export interface MedicationDeliveryProof {
  receiverType: 'PATIENT' | 'FAMILY';
  receiverName: string;
  receiverIdCard?: string;
  receiverIdCardImage?: string;
  receiverFaceImage?: string;
  signature: string;
  timestamp: string;
}

export interface ReasonCode {
  code: string;
  label: string;
  type: 'CLINICAL' | 'PATIENT' | 'LOGISTICS' | 'ADMIN';
}

// --- SURGERY & DVKT ---
/* Fix: Missing SurgeryGroupStatus enum */
export enum SurgeryGroupStatus {
  NEW = 'NEW',
  EXECUTING = 'EXECUTING',
  RESULT = 'RESULT'
}

/* Fix: Missing SurgeryOrderStatus enum */
export enum SurgeryOrderStatus {
  NEW = 'NEW',
  EXECUTING = 'EXECUTING',
  RESULT = 'RESULT',
  CANCELED = 'CANCELED'
}

// --- WARD STOCK & ISSUES ---
export interface WardStockItem {
  id: string;
  drugCode: string;
  drugName: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  lotNumber?: string;
  expiryDate?: string;
}

export enum StockTransactionType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  RETURN = 'RETURN',
  ADJUST = 'ADJUST',
  BROKEN = 'BROKEN'
}

export interface StockTransaction {
  id: string;
  drugCode: string;
  type: StockTransactionType;
  quantityChange: number;
  quantityAfter: number;
  reason?: string;
  referenceId?: string;
  performedBy: string;
  timestamp: string;
}

export enum IssueNoteStatus {
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  DISCREPANCY = 'DISCREPANCY'
}

export enum HisIssueStatus {
  NORMAL = 'NORMAL',
  UPDATED = 'UPDATED',
  CANCELED = 'CANCELED'
}

export interface IssueNoteItem {
  id: string;
  drugCode: string;
  drugName: string;
  unit: string;
  qtySent: number;
  qtyReceived: number;
  note?: string;
  lotNumber: string;
  expiryDate?: string;
  discrepancyReason?: string;
  discrepancyImage?: string;
}

export interface IssueNote {
  id: string;
  code: string;
  createdDate: string;
  status: IssueNoteStatus;
  hisStatus: HisIssueStatus;
  pharmacyNote?: string;
  items: IssueNoteItem[];
  receivedBy?: string;
  receivedAt?: string;
}

// --- SHIFT & COMPLIANCE ---
export enum ShiftStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED'
}

export interface ShiftSummary {
  shift: ShiftType;
  date: string;
  status: ShiftStatus;
  stats: {
    total: number;
    completed: number;
    pending: number;
    returnPending: number;
  };
}

export interface ComplianceStats {
  shift: ShiftType;
  totalPatients: number;
  missedDoses: number;
  stockoutRisks: number;
  pendingReturns: number;
  syncFailures: number;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  patientId: string;
  patientName: string;
  patientCode: string;
  room: string;
  bed: string;
  missedItems: MARItem[];
  stockoutItems: MARItem[];
  returnItems: MARItem[];
}

// --- SYNC ---
export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum SyncType {
  ADMINISTRATION = 'ADMINISTRATION',
  RETURN = 'RETURN',
  SHIFT_CLOSE = 'SHIFT_CLOSE',
  VITALS = 'VITALS'
}

export interface SyncQueueItem {
  id: string;
  type: SyncType;
  referenceId: string;
  payload: any;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
}

// --- OTHERS ---
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  uploadDate: string;
}

export interface MedicalRecord { 
  id: string; 
  patientId?: string; 
  reasonForAdmission?: string;
  medicalHistory?: string;
  clinicalExamination?: string;
  treatmentPlan?: string;
  attachments?: Attachment[]; 
}

/* Fix: Missing MedicalRecordMain interface */
export interface MedicalRecordMain {
  process: string;
  medicalHistory: string;
  clinicalExam: string;
  subclinicalResults: string;
  treatmentDirection: string;
}

/* Fix: Missing MedicalRecordConclusion interface */
export interface MedicalRecordConclusion {
  dischargeDate: string;
  dischargeDiagnosis: string;
  treatmentResult: string;
  dischargeAdvice: string;
}

/* Fix: Missing RecordCategory interface */
export interface RecordCategory {
  code: string;
  name: string;
  children?: { code: string; name: string }[];
}

export interface VitalSign { 
  id: string; 
  patientId: string;
  timestamp: string;
  temperature: number;
  heartRate: number;
  spO2: number;
  bpSystolic: number;
  bpDiastolic: number;
  respiratoryRate: number;
  creatorId: string;
}

export interface ProgressNote { 
  id: string; 
  patientId: string;
  timestamp: string;
  content: string;
  authorId: string;
  authorName: string;
}

export enum OrderType { MEDICATION = 'MEDICATION', LAB = 'LAB', PROCEDURE = 'PROCEDURE' }
export enum OrderStatus { PENDING = 'PENDING', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }

export interface MedicalOrder {
  id: string;
  patientId: string;
  type: OrderType;
  content: string;
  note?: string;
  status: OrderStatus;
  createdAt: string;
  doctorId: string;
  doctorName: string;
  executedAt?: string;
  executedBy?: string;
  result?: string;
  patientSignature?: string;
}
