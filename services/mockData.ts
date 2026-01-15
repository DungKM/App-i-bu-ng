
import { 
  Patient, PatientStatus, UserRole, MedVisit, MedVisitStatus, 
  WardStockItem, IssueNote, MARItem, MARStatus, ShiftType, 
  TreatmentStatus, SurgeryGroupStatus, SurgeryOrderStatus, 
  OrderType, OrderStatus, MedicalOrder, RxInboxItem, RxChangeType, 
  StockTransaction, SyncQueueItem, SyncStatus, SyncType, 
  ShiftStatus, ShiftSummary, ReasonCode, ComplianceStats 
} from '../types';

export const MOCK_USERS = [
  { id: 'u1', name: 'BS. Nguyễn Văn A', role: UserRole.DOCTOR, avatar: 'https://i.pravatar.cc/150?u=u1', username: 'doctor', password: '123' },
  { id: 'u2', name: 'ĐD. Trần Thị B', role: UserRole.NURSE, avatar: 'https://i.pravatar.cc/150?u=u2', username: 'nurse', password: '123' }
];

export const MOCK_REASON_CODES: ReasonCode[] = [
  { code: 'PATIENT_REFUSED', label: 'BN từ chối', type: 'PATIENT' },
  { code: 'VOMITING', label: 'Nôn', type: 'CLINICAL' },
  { code: 'NPO', label: 'Nhịn ăn uống (NPO)', type: 'CLINICAL' },
  { code: 'OUT_OF_STOCK', label: 'Hết thuốc', type: 'LOGISTICS' },
];

export const MOCK_PATIENTS: Patient[] = [
  { 
    id: 'p1', code: 'BN23001', name: 'PHẠM VĂN MINH', dob: '1985-05-15', gender: 'Nam', 
    room: 'P401', bed: 'G01', diagnosis: 'Viêm phổi cộng đồng, ĐTĐ Type 2', 
    admissionDate: '2023-10-25', status: PatientStatus.STABLE, insurance: true,
    medicationToday: { total: 5, done: 2, overdue: 0, status: 'PENDING' },
    isSpecialCare: false
  },
  { 
    id: 'p2', code: 'BN23002', name: 'LÊ THỊ MAI', dob: '1992-08-20', gender: 'Nữ', 
    room: 'P401', bed: 'G02', diagnosis: 'Sốt xuất huyết Dengue ngày 4', 
    admissionDate: '2023-10-26', status: PatientStatus.STABLE, insurance: true,
    medicationToday: { total: 3, done: 3, overdue: 0, status: 'DONE' },
    isSpecialCare: false
  },
  { 
    id: 'p3', code: 'BN23003', name: 'NGUYỄN THỊ CÚC', dob: '1950-01-10', gender: 'Nữ', 
    room: 'P402', bed: 'G01', diagnosis: 'Suy tim NYHA III, THA', 
    admissionDate: '2023-10-20', status: PatientStatus.CRITICAL, insurance: true,
    medicationToday: { total: 6, done: 1, overdue: 1, status: 'OVERDUE' },
    isSpecialCare: false
  }
];

export const MOCK_MED_VISITS: MedVisit[] = [
    {
        id: 'mv1', patientId: 'p1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam',
        deptCode: 'NOI1', room: 'P401', bed: 'G01', admissionDate: '2023-10-25T08:00:00',
        encounterCode: 'EC-231025-001', lastMedicationOrderAt: '2023-10-25 08:00',
        status: MedVisitStatus.PARTIALLY_DISPENSED, treatmentStatus: TreatmentStatus.IN_PROGRESS, doctorName: 'BS. Nguyễn Văn A'
    },
    {
        id: 'mv1_old_1', patientId: 'p1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam',
        deptCode: 'NGOAI', room: 'P205', bed: 'G12', admissionDate: '2023-05-10T10:30:00', dischargeDate: '2023-05-20T16:00:00',
        encounterCode: 'EC-230510-042', lastMedicationOrderAt: '2023-05-10 11:00',
        status: MedVisitStatus.FULLY_DISPENSED, treatmentStatus: TreatmentStatus.FINISHED, doctorName: 'BS. Trần Văn C'
    },
    {
        id: 'mv1_old_2', patientId: 'p1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam',
        deptCode: 'NOI2', room: 'P301', bed: 'G05', admissionDate: '2022-12-01T09:00:00', dischargeDate: '2022-12-15T11:00:00',
        encounterCode: 'EC-221201-115', lastMedicationOrderAt: '2022-12-01 09:00',
        status: MedVisitStatus.FULLY_DISPENSED, treatmentStatus: TreatmentStatus.FINISHED, doctorName: 'BS. Lê Thị D'
    },
    // Lần khám ko có thuốc (Dùng để kiểm chứng logic lọc)
    {
        id: 'mv1_no_med', patientId: 'p1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam',
        deptCode: 'KHAMBENH', room: 'B10', bed: '0', admissionDate: '2022-06-01T09:00:00', dischargeDate: '2022-06-01T11:00:00',
        encounterCode: 'EC-220601-002', lastMedicationOrderAt: undefined, // Không có ngày kê thuốc
        status: MedVisitStatus.FULLY_DISPENSED, treatmentStatus: TreatmentStatus.FINISHED, doctorName: 'BS. Ngoại Trú X'
    }
];

export const MOCK_MAR: MARItem[] = [
  // BN PHẠM VĂN MINH (mv1)
  { 
      id: 'm1', visitId: 'mv1', patientId: 'p1', 
      orderId: 'ORD-001', orderDate: '2023-10-25 08:00', doctorName: 'BS. Nguyễn Văn A',
      drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', 
      shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'ĐD. Trần Thị B', administeredAt: '2023-10-25 08:15' 
  },
  // BN PHẠM VĂN MINH (mv1_old_1)
  { 
      id: 'm_old_1', visitId: 'mv1_old_1', patientId: 'p1', 
      orderId: 'ORD-OLD-01', orderDate: '2023-05-10 11:00', doctorName: 'BS. Trần Văn C',
      drugName: 'Augmentin 1g', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', 
      shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'ĐD. Lê Văn D' 
  },
  // BN PHẠM VĂN MINH (mv1_old_2)
  { 
      id: 'm_old_2', visitId: 'mv1_old_2', patientId: 'p1', 
      orderId: 'ORD-OLD-02', orderDate: '2022-12-01 09:00', doctorName: 'BS. Lê Thị D',
      drugName: 'Vật lý trị liệu hô hấp', dosage: '1 lần', route: 'Thực hiện', scheduledTime: '09:00', 
      shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: false, administeredBy: 'KTV. Nguyễn Văn E' 
  }
];

// ... Các MOCK khác giữ nguyên cấu trúc cũ nhưng có dữ liệu tương ứng
export const MOCK_WARD_STOCK: WardStockItem[] = [
  { id: 'ws1', drugCode: 'PARA500', drugName: 'Paracetamol 500mg', unit: 'Viên', quantity: 150, minQuantity: 50, lotNumber: 'L001', expiryDate: '2024-12-31' },
];

export const BackendSyncController = { addToQueue: (type: SyncType, referenceId: string, payload: any) => ({ id: 's1' }), processQueue: () => ({ processed: 1, failed: 0 }), retryItem: (id: string) => null, getQueue: () => [] };
export const BackendShiftController = { getShiftSummary: (shift: ShiftType): ShiftSummary => { const items = MOCK_MAR.filter(m => m.shift === shift); return { shift, date: new Date().toISOString(), status: ShiftStatus.OPEN, stats: { total: items.length, completed: items.filter(m => m.status === MARStatus.ADMINISTERED).length, pending: items.filter(m => m.status === MARStatus.SCHEDULED || m.status === MARStatus.MISSED).length, returnPending: items.filter(m => m.status === MARStatus.RETURN_PENDING).length } }; }, closeShift: (shift: ShiftType) => ({ success: true, status: ShiftStatus.LOCKED }), reopenShift: (shift: ShiftType, reason: string) => ({ success: true, status: ShiftStatus.OPEN }) };
export const BackendWardController = { confirmIssueNote: (id: string, items: any[]) => null, adjustStock: (drugCode: string, qty: number, reason: string) => null };
export const BackendMARController = { updateMARStatus: (id: string, status: MARStatus, data: any) => null, freezeRxVersion: (patientId: string) => ({ success: true }) };
export const BackendComplianceController = { getStats: (shift: ShiftType): ComplianceStats => ({ shift, totalPatients: 6, missedDoses: MOCK_MAR.filter(m => m.shift === shift && m.status === MARStatus.MISSED).length, stockoutRisks: 0, pendingReturns: MOCK_MAR.filter(m => m.shift === shift && m.status === MARStatus.RETURN_PENDING).length, syncFailures: 0, issues: [] }) };

export let MOCK_RX_INBOX: RxInboxItem[] = [];
export let MOCK_TREATMENTS: any[] = [];
export let MOCK_MEDICAL_RECORDS: any[] = [];
export let MOCK_RECORD_PAGES: any = {};
export let MOCK_VITALS: any[] = [];
export let MOCK_NOTES: any[] = [];
export let MOCK_ORDERS: MedicalOrder[] = [];
export let MOCK_MED_ORDERS: any[] = [];
export let MOCK_MED_GROUPS: any[] = [];
export let MOCK_FILES: any[] = [];
export let MOCK_HISTORY: any[] = [];
export let MOCK_SURGERY_GROUPS: any[] = [];
export let MOCK_ISSUE_NOTES: IssueNote[] = [];
export let MOCK_STOCK_TRANSACTIONS: StockTransaction[] = [];
export let MOCK_SYNC_QUEUE: SyncQueueItem[] = [];
