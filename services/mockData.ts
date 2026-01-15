
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
  { code: 'BRADY_CARDIA', label: 'Nhịp chậm (<60)', type: 'CLINICAL' },
];

export const MOCK_PATIENTS: Patient[] = [
  { 
    id: 'p1', code: 'BN23001', name: 'PHẠM VĂN MINH', dob: '1985-05-15', gender: 'Nam', 
    room: 'P401', bed: 'G01', diagnosis: 'Viêm phổi cộng đồng, ĐTĐ Type 2', 
    admissionDate: '2023-10-25', status: PatientStatus.STABLE, insurance: true,
    medicationToday: { total: 8, done: 3, overdue: 0, status: 'PENDING' },
    isSpecialCare: false
  },
  { 
    id: 'p2', code: 'BN23002', name: 'LÊ THỊ MAI', dob: '1992-08-20', gender: 'Nữ', 
    room: 'P401', bed: 'G02', diagnosis: 'Sốt xuất huyết Dengue ngày 4', 
    admissionDate: '2023-10-26', status: PatientStatus.STABLE, insurance: true,
    medicationToday: { total: 5, done: 5, overdue: 0, status: 'DONE' },
    isSpecialCare: false
  },
  { 
    id: 'p3', code: 'BN23003', name: 'NGUYỄN THỊ CÚC', dob: '1950-01-10', gender: 'Nữ', 
    room: 'P402', bed: 'G01', diagnosis: 'Suy tim NYHA III, THA', 
    admissionDate: '2023-10-20', status: PatientStatus.CRITICAL, insurance: true,
    medicationToday: { total: 10, done: 4, overdue: 2, status: 'OVERDUE' },
    isSpecialCare: true
  }
];

export const MOCK_MED_VISITS: MedVisit[] = [
    {
        id: 'mv1', patientId: 'p1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam',
        deptCode: 'NOI1', room: 'P401', bed: 'G01', admissionDate: '2023-10-25T08:00:00',
        encounterCode: 'EC-231025-001', lastMedicationOrderAt: '2023-10-27 08:00',
        status: MedVisitStatus.PARTIALLY_DISPENSED, treatmentStatus: TreatmentStatus.IN_PROGRESS, doctorName: 'BS. Nguyễn Văn A'
    },
    {
        id: 'mv2', patientId: 'p2', patientName: 'LÊ THỊ MAI', patientCode: 'BN23002', patientGender: 'Nữ',
        deptCode: 'NOI1', room: 'P401', bed: 'G02', admissionDate: '2023-10-26T09:30:00',
        encounterCode: 'EC-231026-045', lastMedicationOrderAt: '2023-10-27 07:30',
        status: MedVisitStatus.FULLY_DISPENSED, treatmentStatus: TreatmentStatus.IN_PROGRESS, doctorName: 'BS. Nguyễn Văn A'
    },
    {
        id: 'mv3', patientId: 'p3', patientName: 'NGUYỄN THỊ CÚC', patientCode: 'BN23003', patientGender: 'Nữ',
        deptCode: 'NOI1', room: 'P402', bed: 'G01', admissionDate: '2023-10-20T14:00:00',
        encounterCode: 'EC-231020-009', lastMedicationOrderAt: '2023-10-27 08:15',
        status: MedVisitStatus.PARTIALLY_DISPENSED, treatmentStatus: TreatmentStatus.IN_PROGRESS, doctorName: 'BS. Lê Thị D'
    }
];

export const MOCK_MAR: MARItem[] = [
  // --- BN: PHẠM VĂN MINH (mv1) ---
  { id: 'm1', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-001', drugName: 'Ceftriaxone 1g', dosage: '1 lọ', route: 'Tiêm TM', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:15', administeredBy: 'ĐD. Trần Thị B', requiresScan: true },
  { id: 'm2', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-002', drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:20', administeredBy: 'ĐD. Trần Thị B', requiresScan: true },
  { id: 'm3', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-003', drugName: 'Metformin 850mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:20', administeredBy: 'ĐD. Trần Thị B', requiresScan: true },
  { id: 'm4', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-002', drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '12:00', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm5', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-001', drugName: 'Ceftriaxone 1g', dosage: '1 lọ', route: 'Tiêm TM', scheduledTime: '16:00', shift: ShiftType.AFTERNOON, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm6', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-002', drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '18:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true },

  // --- BN: LÊ THỊ MAI (mv2) ---
  { id: 'm10', visitId: 'mv2', patientId: 'p2', orderId: 'ORD-101', drugName: 'Ringer Lactat 500ml', dosage: '1 chai', route: 'Truyền TM (30 g/p)', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:05', administeredBy: 'ĐD. Trần Thị B', requiresScan: true },
  { id: 'm11', visitId: 'mv2', patientId: 'p2', orderId: 'ORD-102', drugName: 'Vitamin C 1g', dosage: '1 ống', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:06', administeredBy: 'ĐD. Trần Thị B', requiresScan: true },
  { id: 'm12', visitId: 'mv2', patientId: 'p2', orderId: 'ORD-101', drugName: 'Ringer Lactat 500ml', dosage: '1 chai', route: 'Truyền TM (30 g/p)', scheduledTime: '14:00', shift: ShiftType.AFTERNOON, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 14:10', administeredBy: 'ĐD. Trần Thị B', requiresScan: true },

  // --- BN: NGUYỄN THỊ CÚC (mv3) - Ca lâm sàng phức tạp ---
  { id: 'm20', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-201', drugName: 'Furosemid 20mg', dosage: '1 ống', route: 'Tiêm TM chậm', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:30', administeredBy: 'ĐD. Trần Thị B', requiresScan: true },
  { id: 'm21', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-202', drugName: 'Digoxin 0.25mg', dosage: '1/2 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.RETURN_PENDING, reasonCode: 'BRADY_CARDIA', note: 'Nhịp tim BN 55 l/p, báo bác sĩ hoãn dùng.', requiresScan: true },
  { id: 'm22', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-203', drugName: 'Enalapril 5mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.MISSED, note: 'BN đang đi chụp CT-Scanner', requiresScan: true },
  { id: 'm23', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-204', drugName: 'Kali Clorid 0.6g', dosage: '1 viên', route: 'Uống', scheduledTime: '12:00', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm24', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-201', drugName: 'Furosemid 20mg', dosage: '1 ống', route: 'Tiêm TM chậm', scheduledTime: '16:00', shift: ShiftType.AFTERNOON, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm25', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-205', drugName: 'Morphin 10mg', dosage: '1/2 ống', route: 'Tiêm dưới da', scheduledTime: '20:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true },
];

export const MOCK_SURGERY_GROUPS: any[] = [
  {
    id: 'sg1',
    patientId: 'p1',
    patientName: 'PHẠM VĂN MINH',
    patientCode: 'BN23001',
    status: SurgeryGroupStatus.NEW,
    indicationPerson: 'BS. Nguyễn Văn A',
    indicationDate: '2023-10-27T09:00:00',
    indicationDept: 'Khoa Nội Tổng Hợp',
    diagnosis: 'Viêm phổi cộng đồng / Theo dõi tràn dịch màng phổi',
    fulfillDeptCode: 'CDHA',
    orders: [
      { id: 'ord-sg1-1', serviceName: 'X-Quang ngực thẳng tại giường', status: SurgeryOrderStatus.NEW, obs: { conclusion: '' } },
      { id: 'ord-sg1-2', serviceName: 'Siêu âm màng phổi (máy xách tay)', status: SurgeryOrderStatus.NEW, obs: { conclusion: '' } }
    ]
  },
  {
    id: 'sg2',
    patientId: 'p2',
    patientName: 'LÊ THỊ MAI',
    patientCode: 'BN23002',
    status: SurgeryGroupStatus.EXECUTING,
    indicationPerson: 'BS. Nguyễn Văn A',
    indicationDate: '2023-10-27T08:30:00',
    indicationDept: 'Khoa Nội Tổng Hợp',
    diagnosis: 'Sốt xuất huyết Dengue ngày 4 / Theo dõi xuất huyết nội tạng',
    fulfillDeptCode: 'CDHA',
    orders: [
      { id: 'ord-sg2-1', serviceName: 'Chụp CT-Scanner ổ bụng có thuốc cản quang', status: SurgeryOrderStatus.EXECUTING, obs: { conclusion: 'Đang chờ bác sĩ đọc kết quả...' } }
    ]
  }
];

export const MOCK_WARD_STOCK: WardStockItem[] = [
  { id: 'ws1', drugCode: 'PARA500', drugName: 'Paracetamol 500mg', unit: 'Viên', quantity: 150, minQuantity: 50, lotNumber: 'L001', expiryDate: '2024-12-31' },
  { id: 'ws2', drugCode: 'CEF1G', drugName: 'Ceftriaxone 1g', unit: 'Lọ', quantity: 20, minQuantity: 10, lotNumber: 'L002', expiryDate: '2024-06-30' },
  { id: 'ws3', drugCode: 'FURO20', drugName: 'Furosemid 20mg', unit: 'Ống', quantity: 45, minQuantity: 20, lotNumber: 'L003', expiryDate: '2025-01-15' },
];

export const BackendSyncController = { addToQueue: (type: SyncType, referenceId: string, payload: any) => ({ id: 's1' }), processQueue: () => ({ processed: 1, failed: 0 }), retryItem: (id: string) => null, getQueue: () => [] };
export const BackendShiftController = { getShiftSummary: (shift: ShiftType): ShiftSummary => { const items = MOCK_MAR.filter(m => m.shift === shift); return { shift, date: new Date().toISOString(), status: ShiftStatus.OPEN, stats: { total: items.length, completed: items.filter(m => m.status === MARStatus.ADMINISTERED).length, pending: items.filter(m => m.status === MARStatus.SCHEDULED || m.status === MARStatus.MISSED).length, returnPending: items.filter(m => m.status === MARStatus.RETURN_PENDING).length } }; }, closeShift: (shift: ShiftType) => ({ success: true, status: ShiftStatus.LOCKED }), reopenShift: (shift: ShiftType, reason: string) => ({ success: true, status: ShiftStatus.OPEN }) };
export const BackendWardController = { confirmIssueNote: (id: string, items: any[]) => null, adjustStock: (drugCode: string, qty: number, reason: string) => null };
export const BackendMARController = { updateMARStatus: (id: string, status: MARStatus, data: any) => null, freezeRxVersion: (patientId: string) => ({ success: true }) };
export const BackendComplianceController = { getStats: (shift: ShiftType): ComplianceStats => ({ shift, totalPatients: 6, missedDoses: MOCK_MAR.filter(m => m.shift === shift && m.status === MARStatus.MISSED).length, stockoutRisks: 0, pendingReturns: MOCK_MAR.filter(m => m.shift === shift && m.status === MARStatus.RETURN_PENDING).length, syncFailures: 0, issues: [] }) };

export let MOCK_RX_INBOX: RxInboxItem[] = [];
export let MOCK_TREATMENTS: any[] = [
  { id: 't1', patientId: 'p1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam', room: 'P401', bed: 'G01', deptCode: 'NOI1', doctorName: 'BS. Nguyễn Văn A', admissionDate: '2023-10-25', diagnosis: 'Viêm phổi cộng đồng', status: TreatmentStatus.IN_PROGRESS, visitId: 'mv1', medicalRecordId: 'mr1' }
];
export let MOCK_MEDICAL_RECORDS: any[] = [];
export let MOCK_RECORD_PAGES: any = {};
export let MOCK_VITALS: any[] = [];
export let MOCK_NOTES: any[] = [];
export let MOCK_ORDERS: MedicalOrder[] = [];
export let MOCK_MED_ORDERS: any[] = [];
export let MOCK_MED_GROUPS: any[] = [];
export let MOCK_FILES: any[] = [];
export let MOCK_HISTORY: any[] = [];
export let MOCK_ISSUE_NOTES: IssueNote[] = [];
export let MOCK_STOCK_TRANSACTIONS: StockTransaction[] = [];
export let MOCK_SYNC_QUEUE: SyncQueueItem[] = [];
