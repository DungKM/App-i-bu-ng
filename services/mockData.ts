
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
  },
  { 
    id: 'p4', code: 'BN23004', name: 'TRẦN VĂN DŨNG', dob: '1978-12-05', gender: 'Nam', 
    room: 'P402', bed: 'G02', diagnosis: 'Viêm loét dạ dày tá tràng', 
    admissionDate: '2023-10-27', status: PatientStatus.STABLE, insurance: false,
    medicationToday: { total: 4, done: 0, overdue: 0, status: 'PENDING' }
  },
  { 
    id: 'p5', code: 'BN23005', name: 'HOÀNG VĂN THÁI', dob: '1965-03-22', gender: 'Nam', 
    room: 'CC01', bed: 'G01', diagnosis: 'Nhồi máu cơ tim cấp', 
    admissionDate: '2023-10-28', status: PatientStatus.CRITICAL, insurance: true,
    medicationToday: { total: 8, done: 4, overdue: 0, status: 'PENDING' },
    isSpecialCare: false
  },
  { 
    id: 'p6', code: 'BN23006', name: 'BÙI THỊ HÀ', dob: '1989-11-30', gender: 'Nữ', 
    room: 'P501', bed: 'G02', diagnosis: 'Nhiễm trùng đường tiết niệu', 
    admissionDate: '2023-10-29', status: PatientStatus.DISCHARGING, insurance: true,
    medicationToday: { total: 2, done: 2, overdue: 0, status: 'DONE' }
  }
];

export const MOCK_MED_VISITS: MedVisit[] = MOCK_PATIENTS.map(p => ({
    id: p.id.replace('p', 'mv'),
    patientId: p.id,
    patientName: p.name,
    patientCode: p.code,
    patientGender: p.gender,
    deptCode: 'NOI1',
    room: p.room,
    bed: p.bed,
    admissionDate: p.admissionDate,
    status: p.medicationToday?.status === 'DONE' ? MedVisitStatus.FULLY_DISPENSED : MedVisitStatus.PARTIALLY_DISPENSED,
    marSummary: p.medicationToday ? {
        total: p.medicationToday.total,
        pending: p.medicationToday.total - p.medicationToday.done,
        missed: p.medicationToday.overdue,
        returnPending: p.id === 'p1' ? 1 : 0 // Demo 1 liều cần trả kho cho BN Minh
    } : undefined
}));

export const MOCK_MAR: MARItem[] = [
  // BN PHẠM VĂN MINH (mv1)
  { id: 'm1', visitId: 'mv1', patientId: 'p1', orderId: 'o1', drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm2', visitId: 'mv1', patientId: 'p1', orderId: 'o2', drugName: 'Ciprofloxacin 500mg', dosage: '1 chai', route: 'Tiêm TM', scheduledTime: '09:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm3', visitId: 'mv1', patientId: 'p1', orderId: 'o3', drugName: 'Mobic 15mg', dosage: '1 viên', route: 'Uống', scheduledTime: '13:00', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm4', visitId: 'mv1', patientId: 'p1', orderId: 'o4', drugName: 'Pantoprazol 40mg', dosage: '1 viên', route: 'Uống', scheduledTime: '18:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm5', visitId: 'mv1', patientId: 'p1', orderId: 'o5', drugName: 'Amlodipin 5mg', dosage: '1 viên', route: 'Uống', scheduledTime: '13:30', shift: ShiftType.NOON, status: MARStatus.RETURN_PENDING, requiresScan: true, reasonCode: 'PATIENT_REFUSED', note: 'BN buồn nôn, không uống được' },

  // BN LÊ THỊ MAI (mv2) - Đã hoàn thành
  { id: 'm21', visitId: 'mv2', patientId: 'p2', orderId: 'o21', drugName: 'Hapacol 650mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm22', visitId: 'mv2', patientId: 'p2', orderId: 'o22', drugName: 'Oresol 245', dosage: '1 gói', route: 'Uống', scheduledTime: '10:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: false, administeredBy: 'Trần Thị B' },
  { id: 'm23', visitId: 'mv2', patientId: 'p2', orderId: 'o23', drugName: 'Vitamin C 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '14:00', shift: ShiftType.AFTERNOON, status: MARStatus.ADMINISTERED, requiresScan: false, administeredBy: 'Trần Thị B' },

  // BN NGUYỄN THỊ CÚC (mv3) - Có thuốc quá giờ
  { id: 'm31', visitId: 'mv3', patientId: 'p3', orderId: 'o31', drugName: 'Furosemid 20mg', dosage: '1 ống', route: 'Tiêm TM', scheduledTime: '07:00', shift: ShiftType.MORNING, status: MARStatus.MISSED, requiresScan: true },
  { id: 'm32', visitId: 'mv3', patientId: 'p3', orderId: 'o32', drugName: 'Digoxin 0.25mg', dosage: '1/2 viên', route: 'Uống', scheduledTime: '08:30', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm33', visitId: 'mv3', patientId: 'p3', orderId: 'o33', drugName: 'Enalapril 5mg', dosage: '1 viên', route: 'Uống', scheduledTime: '12:30', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true },

  // BN HOÀNG VĂN THÁI (mv5) - Nhiều y lệnh
  { id: 'm51', visitId: 'mv5', patientId: 'p5', orderId: 'o51', drugName: 'Heparin 5000UI', dosage: '1 ống', route: 'Tiêm dưới da', scheduledTime: '06:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm52', visitId: 'mv5', patientId: 'p5', orderId: 'o52', drugName: 'Heparin 5000UI', dosage: '1 ống', route: 'Tiêm dưới da', scheduledTime: '12:00', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm53', visitId: 'mv5', patientId: 'p5', orderId: 'o53', drugName: 'Heparin 5000UI', dosage: '1 ống', route: 'Tiêm dưới da', scheduledTime: '18:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm54', visitId: 'mv5', patientId: 'p5', orderId: 'o54', drugName: 'Heparin 5000UI', dosage: '1 ống', route: 'Tiêm dưới da', scheduledTime: '00:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true },
  { id: 'm55', visitId: 'mv5', patientId: 'p5', orderId: 'o55', drugName: 'Lovenox 40mg', dosage: '1 bơm', route: 'Tiêm dưới da', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm56', visitId: 'mv5', patientId: 'p5', orderId: 'o56', drugName: 'Aspirin 81mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm57', visitId: 'mv5', patientId: 'p5', orderId: 'o57', drugName: 'Clopidogrel 75mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, requiresScan: true, administeredBy: 'Trần Thị B' },
  { id: 'm58', visitId: 'mv5', patientId: 'p5', orderId: 'o58', drugName: 'Atorvastatin 20mg', dosage: '1 viên', route: 'Uống', scheduledTime: '20:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true },
];

export const MOCK_WARD_STOCK: WardStockItem[] = [
  { id: 'ws1', drugCode: 'PARA500', drugName: 'Paracetamol 500mg', unit: 'Viên', quantity: 150, minQuantity: 50, lotNumber: 'L001', expiryDate: '2024-12-31' },
  { id: 'ws2', drugCode: 'CIPRO500', drugName: 'Ciprofloxacin 500mg', unit: 'Chai', quantity: 20, minQuantity: 10, lotNumber: 'L002', expiryDate: '2025-06-30' },
  { id: 'ws3', drugCode: 'MOBIC15', drugName: 'Mobic 15mg', unit: 'Viên', quantity: 45, minQuantity: 20, lotNumber: 'L003', expiryDate: '2025-01-15' },
  { id: 'ws4', drugCode: 'HEPARIN', drugName: 'Heparin 5000UI', unit: 'Ống', quantity: 100, minQuantity: 30, lotNumber: 'L004', expiryDate: '2024-09-20' },
];

export const BackendSyncController = {
    addToQueue: (type: SyncType, referenceId: string, payload: any) => ({ id: 's1' }),
    processQueue: () => ({ processed: 1, failed: 0 }),
    retryItem: (id: string) => null,
    getQueue: () => []
};

export const BackendShiftController = {
    getShiftSummary: (shift: ShiftType): ShiftSummary => {
        // Tính toán stats dựa trên MOCK_MAR để đồng bộ UI
        const items = MOCK_MAR.filter(m => m.shift === shift);
        return {
            shift,
            date: new Date().toISOString(),
            status: ShiftStatus.OPEN,
            stats: { 
                total: items.length, 
                completed: items.filter(m => m.status === MARStatus.ADMINISTERED).length, 
                pending: items.filter(m => m.status === MARStatus.SCHEDULED || m.status === MARStatus.MISSED).length, 
                returnPending: items.filter(m => m.status === MARStatus.RETURN_PENDING).length 
            }
        };
    },
    closeShift: (shift: ShiftType) => ({ success: true, status: ShiftStatus.LOCKED }),
    reopenShift: (shift: ShiftType, reason: string) => ({ success: true, status: ShiftStatus.OPEN })
};

export const BackendWardController = {
    confirmIssueNote: (id: string, items: any[]) => null,
    adjustStock: (drugCode: string, qty: number, reason: string) => null
};

export const BackendMARController = {
    updateMARStatus: (id: string, status: MARStatus, data: any) => null,
    freezeRxVersion: (patientId: string) => ({ success: true })
};

export const BackendComplianceController = {
    getStats: (shift: ShiftType): ComplianceStats => ({
        shift,
        totalPatients: 6,
        missedDoses: MOCK_MAR.filter(m => m.shift === shift && m.status === MARStatus.MISSED).length,
        stockoutRisks: 0,
        pendingReturns: MOCK_MAR.filter(m => m.shift === shift && m.status === MARStatus.RETURN_PENDING).length,
        syncFailures: 0,
        issues: []
    })
};

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
