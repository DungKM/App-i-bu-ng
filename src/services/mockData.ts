
import {
  Patient, PatientStatus, UserRole, MedVisit, MedVisitStatus,
  WardStockItem, IssueNote, MARItem, MARStatus, ShiftType,
  TreatmentStatus, SurgeryGroupStatus, SurgeryOrderStatus,
  OrderType, OrderStatus, MedicalOrder, RxInboxItem, RxChangeType,
  StockTransaction, SyncQueueItem, SyncStatus, SyncType,
  ShiftStatus, ShiftSummary, ReasonCode, ComplianceStats
} from '@/types';
import { HisIssueStatus, IssueNoteStatus } from '../types';

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
  { code: 'ADVERSE_REACTION', label: 'Phản ứng phụ/Dị ứng', type: 'CLINICAL' },
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
    medicationToday: { total: 5, done: 4, overdue: 0, status: 'PENDING' },
    isSpecialCare: false
  },
  {
    id: 'p3', code: 'BN23003', name: 'NGUYỄN THỊ CÚC', dob: '1950-01-10', gender: 'Nữ',
    room: 'P402', bed: 'G01', diagnosis: 'Suy tim NYHA III, THA',
    admissionDate: '2023-10-20', status: PatientStatus.CRITICAL, insurance: true,
    medicationToday: { total: 12, done: 4, overdue: 2, status: 'OVERDUE' },
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
    status: MedVisitStatus.PARTIALLY_DISPENSED, treatmentStatus: TreatmentStatus.IN_PROGRESS, doctorName: 'BS. Nguyễn Văn A'
  },
  {
    id: 'mv3', patientId: 'p3', patientName: 'NGUYỄN THỊ CÚC', patientCode: 'BN23003', patientGender: 'Nữ',
    deptCode: 'NOI1', room: 'P402', bed: 'G01', admissionDate: '2023-10-20T14:00:00',
    encounterCode: 'EC-231020-099', lastMedicationOrderAt: '2023-10-27 08:15',
    status: MedVisitStatus.PARTIALLY_DISPENSED, treatmentStatus: TreatmentStatus.IN_PROGRESS, doctorName: 'BS. Lê Thị D'
  }
];

export const MOCK_MAR: MARItem[] = [
  // --- BN PHẠM VĂN MINH (mv1) ---
  // Ca Sáng
  { id: 'm1', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-001', drugName: 'Ceftriaxone 1g', dosage: '1 lọ', route: 'Tiêm TM', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:15', administeredBy: 'ĐD. Trần Thị B', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  { id: 'm2', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-002', drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:20', administeredBy: 'ĐD. Trần Thị B', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  { id: 'm3', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-003', drugName: 'Metformin 850mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:20', administeredBy: 'ĐD. Trần Thị B', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  // Ca Trưa
  { id: 'm4', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-002', drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '12:00', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  // Ca Chiều
  { id: 'm5', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-001', drugName: 'Ceftriaxone 1g', dosage: '1 lọ', route: 'Tiêm TM', scheduledTime: '16:00', shift: ShiftType.AFTERNOON, status: MARStatus.SCHEDULED, requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  // Ca Tối
  { id: 'm6', visitId: 'mv1', patientId: 'p1', orderId: 'ORD-004', drugName: 'Mixtard 30 (Insulin)', dosage: '10 UI', route: 'Tiêm dưới da', scheduledTime: '20:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },

  // --- BN LÊ THỊ MAI (mv2) ---
  // Ca Sáng
  { id: 'm10', visitId: 'mv2', patientId: 'p2', orderId: 'ORD-101', drugName: 'Ringer Lactat 500ml', dosage: '1 chai', route: 'Truyền TM (30 g/p)', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:05', administeredBy: 'ĐD. Trần Thị B', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  { id: 'm11', visitId: 'mv2', patientId: 'p2', orderId: 'ORD-102', drugName: 'Vitamin C 1g', dosage: '1 ống', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:06', administeredBy: 'ĐD. Trần Thị B', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  // Ca Trưa
  { id: 'm12', visitId: 'mv2', patientId: 'p2', orderId: 'ORD-103', drugName: 'Paracetamol 500mg', dosage: '1 viên', route: 'Uống', scheduledTime: '12:00', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },
  // Ca Chiều
  { id: 'm13', visitId: 'mv2', patientId: 'p2', orderId: 'ORD-101', drugName: 'Ringer Lactat 500ml', dosage: '1 chai', route: 'Truyền TM (30 g/p)', scheduledTime: '14:00', shift: ShiftType.AFTERNOON, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 14:15', administeredBy: 'ĐD. Trần Thị B', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Nguyễn Văn A' },

  // --- BN NGUYỄN THỊ CÚC (mv3) - Ca lâm sàng phức tạp ---
  // Ca Sáng
  { id: 'm20', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-201', drugName: 'Furosemid 20mg', dosage: '1 ống', route: 'Tiêm TM chậm', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.ADMINISTERED, administeredAt: '2023-10-27 08:30', administeredBy: 'ĐD. Trần Thị B', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Lê Thị D' },
  { id: 'm21', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-202', drugName: 'Digoxin 0.25mg', dosage: '1/2 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.RETURN_PENDING, reasonCode: 'BRADY_CARDIA', note: 'Nhịp tim BN 54 l/p, báo BS hoãn dùng thuốc.', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Lê Thị D' },
  { id: 'm22', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-203', drugName: 'Enalapril 5mg', dosage: '1 viên', route: 'Uống', scheduledTime: '08:00', shift: ShiftType.MORNING, status: MARStatus.MISSED, note: 'BN đang đi chụp CT ổ bụng', requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Lê Thị D' },
  // Ca Trưa
  { id: 'm23', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-204', drugName: 'Kali Clorid 0.6g', dosage: '1 viên', route: 'Uống', scheduledTime: '12:00', shift: ShiftType.NOON, status: MARStatus.SCHEDULED, requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Lê Thị D' },
  // Ca Chiều
  { id: 'm24', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-201', drugName: 'Furosemid 20mg', dosage: '1 ống', route: 'Tiêm TM chậm', scheduledTime: '16:00', shift: ShiftType.AFTERNOON, status: MARStatus.SCHEDULED, requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Lê Thị D' },
  // Ca Tối
  { id: 'm25', visitId: 'mv3', patientId: 'p3', orderId: 'ORD-205', drugName: 'Morphin 10mg', dosage: '1/2 ống', route: 'Tiêm dưới da', scheduledTime: '21:00', shift: ShiftType.NIGHT, status: MARStatus.SCHEDULED, requiresScan: true, orderDate: '2023-10-27', doctorName: 'BS. Lê Thị D' },
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
    indicationDept: 'Khoa Sản',
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
    indicationDept: 'Khoa Sản',
    diagnosis: 'Sốt xuất huyết Dengue ngày 4 / Theo dõi xuất huyết nội tạng',
    fulfillDeptCode: 'CDHA',
    orders: [
      {
        id: 'ord-sg2-1',
        serviceName: 'Chụp CT-Scanner ổ bụng có thuốc cản quang',
        status: SurgeryOrderStatus.EXECUTING,
        obs: { conclusion: 'Đang tiến hành chụp tầng 2. Bệnh nhân hợp tác tốt.' }
      }
    ]
  },
  {
    id: 'sg3',
    patientId: 'p3',
    patientName: 'NGUYỄN THỊ CÚC',
    patientCode: 'BN23003',
    status: SurgeryGroupStatus.RESULT,
    indicationPerson: 'BS. Lê Thị D',
    indicationDate: '2023-10-26T14:20:00',
    indicationDept: 'Khoa Sản',
    diagnosis: 'Suy tim NYHA III / Hẹp hở van 2 lá nặng',
    fulfillDeptCode: 'CDHA',
    orders: [
      {
        id: 'ord-sg3-1',
        serviceName: 'Siêu âm tim Doppler màu (Doppler tim)',
        status: SurgeryOrderStatus.RESULT,
        executionEndTime: '2023-10-26T15:45:00',
        obs: {
          conclusion: 'Dãn buồng tim trái. Hở van 2 lá 3.5/4. EF: 42%. Có dịch màng ngoài tim lượng ít (5mm). Hở van 3 lá nhẹ, áp lực ĐMP không tăng.',
          patientSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
        }
      }
    ]
  }
];

export const MOCK_MED_GROUPS = [
  { id: 'g1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam', room: 'P401', bed: 'G01', prescriptionDate: '2023-10-27T08:00:00', status: MedVisitStatus.PARTIALLY_DISPENSED, itemsCount: 6, dispensedCount: 3 },
  { id: 'g2', patientName: 'NGUYỄN THỊ CÚC', patientCode: 'BN23003', patientGender: 'Nữ', room: 'P402', bed: 'G01', prescriptionDate: '2023-10-27T08:15:00', status: MedVisitStatus.PARTIALLY_DISPENSED, itemsCount: 12, dispensedCount: 4 },
  { id: 'g3', patientName: 'LÊ THỊ MAI', patientCode: 'BN23002', patientGender: 'Nữ', room: 'P401', bed: 'G02', prescriptionDate: '2023-10-27T07:30:00', status: MedVisitStatus.PARTIALLY_DISPENSED, itemsCount: 5, dispensedCount: 4 }
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
        orderId: 'mo1', // Matches existing ID
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
  },
  {
    patientId: 'p2',
    patientName: 'Lê Thị Mai',
    patientCode: 'BN23002',
    hisVersionId: 'v205',
    hisTimestamp: new Date(Date.now() - 3600000).toISOString(),
    currentVersionId: 'v204',
    status: 'PENDING',
    changes: [
      {
        id: 'c4',
        orderId: 'new_2',
        type: RxChangeType.ADD,
        drugName: 'Huyết tương tươi đông lạnh',
        newData: { dosage: '250ml', route: '', frequency: 'Truyền TM' },
        validationErrors: ['Thiếu đường dùng - Vui lòng kiểm tra lại HIS']
      }
    ]
  }
];
export let MOCK_TREATMENTS: any[] = [
  { id: 't1', patientId: 'p1', patientName: 'PHẠM VĂN MINH', patientCode: 'BN23001', patientGender: 'Nam', room: 'P401', bed: 'G01', deptCode: 'NOI1', doctorName: 'BS. Nguyễn Văn A', admissionDate: '2023-10-25', diagnosis: 'Viêm phổi cộng đồng', status: TreatmentStatus.IN_PROGRESS, visitId: 'mv1', medicalRecordId: 'mr1' }
];
export let MOCK_MEDICAL_RECORDS = [
  { id: 'mr1', patientId: 'p1', reasonForAdmission: 'Ho, sốt, khó thở ngày thứ 3', medicalHistory: 'Tăng huyết áp 5 năm, điều trị thường xuyên bằng Amlodipin 5mg.', clinicalExamination: 'Phổi ran nổ 2 đáy, Tim đều T1 T2 rõ. Họng đỏ nhẹ.', treatmentPlan: 'Kháng sinh, kháng viêm, hạ sốt, theo dõi SpO2.', attachments: [{ id: 'a1', name: 'X-Quang Ngực.jpg', url: '#', type: 'image', uploadDate: '2023-10-25T10:00:00Z' }, { id: 'a2', name: 'Xet_nghiem_mau.pdf', url: '#', type: 'pdf', uploadDate: '2023-10-25T10:30:00Z' }] }
];
export let MOCK_RECORD_PAGES = {
  'mr_t1': {
    page1: { patientName: 'Phạm Văn Minh', dob: '1965-05-20', gender: 'Nam', ethnicity: 'Kinh', job: 'Hưu trí', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', contactPerson: 'Phạm Văn B (Con trai)', contactPhone: '0901234567', admissionType: 'Khoa khám bệnh' },
    main: { process: 'Bệnh nhân sốt ngày thứ 3, ho đờm đục, tức ngực.', medicalHistory: 'Tăng huyết áp 5 năm đang điều trị Amlodipin 5mg/ngày.', clinicalExam: 'Tỉnh, tiếp xúc tốt. Da niêm mạc hồng. Phổi ran nổ 2 đáy. Tim đều. Bụng mềm.', subclinicalResults: 'WBC 12.5 G/L, Neu 80%. XQ phổi: Đám mờ thùy dưới phổi phải.', treatmentDirection: 'Kháng sinh Ceftriaxone, Hạ sốt, Long đờm.' },
    conclusion: { dischargeDate: '', dischargeDiagnosis: '', treatmentResult: '', dischargeAdvice: '' }
  }
};
export let MOCK_VITALS = [
  { id: 'v1', patientId: 'p1', timestamp: new Date().toISOString(), temperature: 37.5, heartRate: 88, spO2: 98, bpSystolic: 130, bpDiastolic: 85, respiratoryRate: 20, creatorId: 'u2' },
  { id: 'v2', patientId: 'p3', timestamp: new Date(Date.now() - 7200000).toISOString(), temperature: 36.8, heartRate: 92, spO2: 96, bpSystolic: 150, bpDiastolic: 95, respiratoryRate: 22, creatorId: 'u2' }
];
export let MOCK_NOTES = [
  { id: 'n1', patientId: 'p1', timestamp: new Date(Date.now() - 7200000).toISOString(), content: 'Bệnh nhân tỉnh, tiếp xúc tốt, còn ho khan ít.', authorId: 'u1', authorName: 'BS. Nguyễn Văn A' },
  { id: 'n2', patientId: 'p3', timestamp: new Date(Date.now() - 7200000).toISOString(), content: 'Đường huyết mao mạch lúc 10h: 15.5 mmol/l. Đã xử trí tiêm Insulin nhanh 4UI.', authorId: 'u2', authorName: 'ĐD. Trần Thị B' }
];
export let MOCK_ORDERS: MedicalOrder[] = [
  { id: 'o1', patientId: 'p1', type: OrderType.MEDICATION, content: 'Paracetamol 500mg', note: '1 viên uống khi sốt > 38.5', status: OrderStatus.PENDING, createdAt: new Date(Date.now() - 3600000).toISOString(), doctorId: 'u1', doctorName: 'BS. Nguyễn Văn A' }
];
export let MOCK_MED_ORDERS = [

];

export let MOCK_FILES = [
  { id: 'f1', aggregateId: 't1', category: 'PHIEU_XET_NGHIEM', name: 'XN_Mau_2510.pdf', url: '#', extension: 'pdf', size: '1.2 MB', uploadDate: '2023-10-25T10:00:00Z', uploadedBy: 'u2' }
];
export let MOCK_HISTORY = [
  { id: 'h1', treatmentId: 't1', createdDate: '2023-10-25T08:00:00Z', type: 'TREATMENT', title: 'Nhập viện Nội trú', description: 'Chuyển từ Khoa Khám bệnh', deptName: 'Khoa Nội 1' }
];
export let MOCK_ISSUE_NOTES: IssueNote[] = [
  {
    id: 'in1',
    code: 'PL001-2510',
    createdDate: new Date().toISOString(),
    status: IssueNoteStatus.SENT,
    hisStatus: HisIssueStatus.NORMAL,
    pharmacyNote: 'Cấp thuốc bổ sung ca trực',
    items: [
      { id: 'ini1', drugCode: 'AMLO5', drugName: 'Amlodipin 5mg', unit: 'Viên', qtySent: 50, qtyReceived: 50, lotNumber: 'L002', expiryDate: '2024-10-20' },
      { id: 'ini2', drugCode: 'PARA500', drugName: 'Paracetamol 500mg', unit: 'Viên', qtySent: 100, qtyReceived: 100, lotNumber: 'L001', expiryDate: '2024-12-31' }
    ]
  },
  {
    id: 'in2',
    code: 'PL002-2510-HUY',
    createdDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: IssueNoteStatus.SENT,
    hisStatus: HisIssueStatus.CANCELED,
    pharmacyNote: 'Hủy do sai khoa',
    items: [
      { id: 'ini3', drugCode: 'CEF1G', drugName: 'Ceftriaxone 1g', unit: 'Lọ', qtySent: 20, qtyReceived: 0, lotNumber: 'L003' }
    ]
  },
  {
    id: 'in3',
    code: 'PL003-2510-UPD',
    createdDate: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    status: IssueNoteStatus.SENT,
    hisStatus: HisIssueStatus.UPDATED,
    pharmacyNote: 'Cập nhật số lượng',
    items: [
      { id: 'ini4', drugCode: 'INS3070', drugName: 'Insulin Mixtard 30/70', unit: 'Bút', qtySent: 10, qtyReceived: 10, lotNumber: 'INS001' }
    ]
  }
];
export let MOCK_STOCK_TRANSACTIONS: StockTransaction[] = [];
export let MOCK_SYNC_QUEUE: SyncQueueItem[] = [];
