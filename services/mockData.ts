
import { 
  Patient, PatientStatus, UserRole, User, MedVisit, MedVisitStatus, 
  WardStockItem, IssueNote, IssueNoteStatus, HisIssueStatus, 
  MARItem, MARStatus, ShiftType, TreatmentStatus, SurgeryGroupStatus, 
  SurgeryOrderStatus, OrderType, OrderStatus, MedGroupStatus, MedOrderStatus, 
  MedicalOrder, RxInboxItem, RxChangeType, StockTransaction, StockTransactionType, 
  ReasonCode, ShiftStatus, ShiftSummary, SyncQueueItem, SyncStatus, SyncType, 
  ComplianceStats, ComplianceIssue 
} from '../types';

export const MOCK_USERS = [
  { id: 'u1', name: 'BS. Nguyễn Văn A', role: UserRole.DOCTOR, avatar: 'https://i.pravatar.cc/150?u=u1', username: 'doctor', password: '123' },
  { id: 'u2', name: 'ĐD. Trần Thị B', role: UserRole.NURSE, avatar: 'https://i.pravatar.cc/150?u=u2', username: 'nurse', password: '123' }
];

export const MOCK_REASON_CODES: ReasonCode[] = [
  { code: 'PATIENT_REFUSED', label: 'BN từ chối', type: 'PATIENT' },
  { code: 'VOMITING', label: 'Nôn', type: 'CLINICAL' },
  { code: 'NPO', label: 'Nhịn ăn uống (NPO)', type: 'CLINICAL' },
  { code: 'LOW_BP', label: 'Huyết áp thấp', type: 'CLINICAL' },
  { code: 'OUT_OF_STOCK', label: 'Hết thuốc', type: 'LOGISTICS' },
  { code: 'OTHER', label: 'Khác', type: 'ADMIN' },
];

export const MOCK_PATIENTS: Patient[] = [
  { 
    id: 'p1', code: 'BN23001', name: 'Phạm Văn Minh', dob: '1965-05-20', gender: 'Nam', room: 'P401', bed: 'G01', 
    diagnosis: 'Viêm phổi cộng đồng', admissionDate: '2023-10-25', status: PatientStatus.STABLE, insurance: true,
    medicationToday: { total: 4, done: 4, overdue: 0, status: 'DONE' },
    isSpecialCare: false
  },
  { 
    id: 'p2', code: 'BN23002', name: 'Lê Thị Mai', dob: '1980-11-12', gender: 'Nữ', room: 'CC01', bed: 'G02', 
    diagnosis: 'Sốt xuất huyết Dengue', admissionDate: '2023-10-26', status: PatientStatus.CRITICAL, insurance: true,
    medicationToday: { total: 6, done: 2, overdue: 1, status: 'OVERDUE' },
    isSpecialCare: true
  },
  { 
    id: 'p3', code: 'BN23003', name: 'Nguyễn Thị Cúc', dob: '1955-02-15', gender: 'Nữ', room: 'P402', bed: 'G01', 
    diagnosis: 'Đái tháo đường type 2', admissionDate: '2023-10-20', status: PatientStatus.STABLE, insurance: true,
    medicationToday: { total: 3, done: 2, overdue: 0, status: 'PENDING' },
    isSpecialCare: false
  },
  { 
    id: 'p4', code: 'BN23004', name: 'Trần Văn Dũng', dob: '1995-08-10', gender: 'Nam', room: 'P501', bed: 'G03', 
    diagnosis: 'Gãy kín xương đùi', admissionDate: '2023-10-27', status: PatientStatus.STABLE, insurance: false,
    medicationToday: { total: 2, done: 0, overdue: 0, status: 'PENDING' },
    isSpecialCare: false
  },
  { 
    id: 'p5', code: 'BN23005', name: 'Hoàng Văn Thái', dob: '1942-03-10', gender: 'Nam', room: 'P401', bed: 'G02', 
    diagnosis: 'Suy tim độ 3', admissionDate: '2023-10-28', status: PatientStatus.CRITICAL, insurance: true,
    medicationToday: { total: 5, done: 1, overdue: 2, status: 'OVERDUE' },
    isSpecialCare: true
  },
  { 
    id: 'p6', code: 'BN23006', name: 'Bùi Thị Hà', dob: '1970-07-22', gender: 'Nữ', room: 'P401', bed: 'G04', 
    diagnosis: 'Hậu phẫu ruột thừa', admissionDate: '2023-10-29', status: PatientStatus.STABLE, insurance: true,
    medicationToday: { total: 0, done: 0, overdue: 0, status: 'NONE' },
    isSpecialCare: false
  }
];

export let MOCK_RX_INBOX: RxInboxItem[] = [
  {
    patientId: 'p1',
    patientName: 'Phạm Văn Minh',
    patientCode: 'BN23001',
    hisVersionId: 'v102',
    hisTimestamp: new Date().toISOString(),
    currentVersionId: 'v101',
    status: 'PENDING',
    alerts: [
        { level: 'WARNING', message: 'Tương tác thuốc: Ciprofloxacin có thể tăng tác dụng của Theophylline (nếu dùng).' },
        { level: 'CRITICAL', message: 'Dị ứng: BN có tiền sử dị ứng nhóm Quinolon (Cần xác nhận lại)' }
    ],
    changes: [
      {
        id: 'c1',
        orderId: 'new_1',
        type: RxChangeType.ADD,
        drugName: 'Ciprofloxacin 500mg',
        newData: { dosage: '1 chai', route: 'Tiêm TM', frequency: 'Sáng-Chiều' },
        validationErrors: []
      },
      {
        id: 'c2',
        orderId: 'mo1', 
        type: RxChangeType.UPDATE,
        drugName: 'Paracetamol 500mg',
        oldData: { dosage: '1 viên', route: 'Uống', frequency: '3 lần/ngày' },
        newData: { dosage: '2 viên', route: 'Uống', frequency: '3 lần/ngày', note: 'Đau nhiều thì uống' },
        validationErrors: []
      },
      {
        id: 'c3',
        orderId: 'mo2',
        type: RxChangeType.STOP,
        drugName: 'Augmentin 1g',
        oldData: { dosage: '1 viên', route: 'Uống', frequency: '2 lần/ngày' },
        newData: undefined,
        conflicts: ['Còn 2 liều đang treo (Scheduled) trong MAR', '1 liều đã soạn (Prepared) cần trả kho'],
        validationErrors: []
      }
    ]
  }
];

export let MOCK_TREATMENTS = [
  { id: 't1', patientId: 'p1', visitId: 'mv1', medicalRecordId: 'mr_t1', patientName: 'Phạm Văn Minh', patientCode: 'BN23001', patientDob: '1965-05-20', patientGender: 'Nam', deptCode: 'NOI1', room: 'P401', bed: 'G01', doctorName: 'BS. Nguyễn Văn A', diagnosis: 'Viêm phổi cộng đồng / Tăng huyết áp', admissionDate: '2023-10-25T08:00:00Z', status: TreatmentStatus.IN_PROGRESS, insuranceNumber: 'DN4010123456789' },
  { id: 't2', patientId: 'p2', visitId: 'mv2', medicalRecordId: 'mr_t2', patientName: 'Lê Thị Mai', patientCode: 'BN23002', patientDob: '1980-11-12', patientGender: 'Nữ', deptCode: 'CAPCUU', room: 'CC01', bed: 'G02', doctorName: 'BS. Lê Văn C', diagnosis: 'Sốt xuất huyêt Dengue', admissionDate: '2023-10-26T14:30:00Z', status: TreatmentStatus.IN_PROGRESS }
];

export let MOCK_MEDICAL_RECORDS = [
  { id: 'mr1', patientId: 'p1', reasonForAdmission: 'Ho, sốt, khó thở ngày thứ 3', medicalHistory: 'Tăng huyết áp 5 năm, điều trị thường xuyên bằng Amlodipin 5mg.', clinicalExamination: 'Phổi ran nổ 2 đáy, Tim đều T1 T2 rõ. Họng đỏ nhẹ.', treatmentPlan: 'Kháng sinh, kháng viêm, hạ sốt, theo dõi SpO2.', attachments: [] }
];

export let MOCK_RECORD_PAGES = {
  'mr_t1': {
    page1: { patientName: 'Phạm Văn Minh', dob: '1965-05-20', gender: 'Nam', ethnicity: 'Kinh', job: 'Hưu trí', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', contactPerson: 'Phạm Văn B (Con trai)', contactPhone: '0901234567', admissionType: 'Khoa khám bệnh' },
    main: { process: 'Bệnh nhân sốt ngày thứ 3, ho đờm đục, tức ngực.', medicalHistory: 'Tăng huyết áp 5 năm đang điều trị Amlodipin 5mg/ngày.', clinicalExam: 'Tỉnh, tiếp xúc tốt. Da niêm mạc hồng. Phổi ran nổ 2 đáy. Tim đều. Bụng mềm.', subclinicalResults: 'WBC 12.5 G/L, Neu 80%. XQ phổi: Đám mờ thùy dưới phổi phải.', treatmentDirection: 'Kháng sinh Ceftriaxone, Hạ sốt, Long đờm.' },
    conclusion: { dischargeDate: '', dischargeDiagnosis: '', treatmentResult: '', dischargeAdvice: '' }
  }
};

export let MOCK_VITALS = [
  { id: 'v1', patientId: 'p1', timestamp: new Date().toISOString(), temperature: 37.5, heartRate: 88, spO2: 98, bpSystolic: 130, bpDiastolic: 85, respiratoryRate: 20, creatorId: 'u2' }
];

export let MOCK_NOTES = [
  { id: 'n1', patientId: 'p1', timestamp: new Date(Date.now() - 7200000).toISOString(), content: 'Bệnh nhân tỉnh, tiếp xúc tốt, còn ho khan ít.', authorId: 'u1', authorName: 'BS. Nguyễn Văn A' }
];

export let MOCK_ORDERS: MedicalOrder[] = [
  { id: 'o1', patientId: 'p1', type: OrderType.MEDICATION, content: 'Paracetamol 500mg', note: '1 viên uống khi sốt > 38.5', status: OrderStatus.PENDING, createdAt: new Date(Date.now() - 3600000).toISOString(), doctorId: 'u1', doctorName: 'BS. Nguyễn Văn A' }
];

export let MOCK_SURGERY_GROUPS = [
  {
    id: 'sg1', patientId: 'p1', patientName: 'Phạm Văn Minh', patientCode: 'BN23001', patientDob: '1965-05-20', patientGender: 'Nam', status: SurgeryGroupStatus.NEW, indicationDate: new Date(Date.now() - 3600000).toISOString(), indicationPerson: 'BS. Nguyễn Văn A', indicationDept: 'Khoa Nội', fulfillDeptCode: 'CDHA', diagnosis: 'Theo dõi viêm phổi', icd: 'J18.9',
    orders: [{ id: 'so1', serviceName: 'X-Quang Ngực Thẳng', status: SurgeryOrderStatus.NEW, color: '#dc3545', obs: { conclusion: '' } }]
  }
];

export let MOCK_WARD_STOCK: WardStockItem[] = [
  { id: 'ws1', drugCode: 'PARA500', drugName: 'Paracetamol 500mg', unit: 'Viên', quantity: 150, minQuantity: 50, lotNumber: 'L001', expiryDate: '2024-12-31' }
];

export let MOCK_ISSUE_NOTES: IssueNote[] = [];
export let MOCK_MED_VISITS: MedVisit[] = [];
export let MOCK_MED_GROUPS = [];
export let MOCK_MED_ORDERS = [];
export let MOCK_MAR: MARItem[] = [];
export let MOCK_FILES = [];
export let MOCK_HISTORY = [];
export let MOCK_STOCK_TRANSACTIONS: StockTransaction[] = [];
export let MOCK_SYNC_QUEUE: SyncQueueItem[] = [];

// --- LOGIC CONTROLLERS ---

export const BackendSyncController = {
    addToQueue: (type: SyncType, referenceId: string, payload: any, patientName?: string) => {
        const item: SyncQueueItem = {
            id: Math.random().toString(),
            type,
            referenceId,
            payload,
            status: SyncStatus.PENDING,
            retryCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            patientName
        };
        MOCK_SYNC_QUEUE.unshift(item);
        return item;
    },
    processQueue: () => ({ processed: 0, failed: 0 }),
    retryItem: (id: string) => null,
    getQueue: () => MOCK_SYNC_QUEUE
};

export const BackendShiftController = {
    getShiftSummary: (shift: ShiftType): ShiftSummary => ({
        shift,
        date: new Date().toISOString(),
        status: ShiftStatus.OPEN,
        stats: { total: 0, completed: 0, pending: 0, returnPending: 0 }
    }),
    closeShift: (shift: ShiftType) => ({ success: true, status: ShiftStatus.LOCKED }),
    reopenShift: (shift: ShiftType, reason: string) => ({ success: true, status: ShiftStatus.OPEN })
};

export const BackendWardController = {
    confirmIssueNote: (noteId: string, items: any[]) => null,
    adjustStock: (drugCode: string, newQuantity: number, reason: string) => null
};

export const BackendMARController = {
    updateMARStatus: (id: string, status: MARStatus, data: any) => null,
    freezeRxVersion: (patientId: string) => ({ success: true })
};

export const BackendComplianceController = {
    getStats: (shift: ShiftType): ComplianceStats => ({
        shift,
        totalPatients: 0,
        missedDoses: 0,
        stockoutRisks: 0,
        pendingReturns: 0,
        syncFailures: 0,
        issues: []
    })
};
