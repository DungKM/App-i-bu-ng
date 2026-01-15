
import {
  MOCK_USERS, MOCK_PATIENTS, MOCK_REASON_CODES, MOCK_TREATMENTS,
  MOCK_MEDICAL_RECORDS, MOCK_RECORD_PAGES, MOCK_VITALS, MOCK_NOTES,
  MOCK_ORDERS, MOCK_SURGERY_GROUPS, MOCK_WARD_STOCK, MOCK_ISSUE_NOTES,
  MOCK_MED_VISITS, MOCK_MED_GROUPS, MOCK_MED_ORDERS, MOCK_MAR,
  MOCK_FILES, MOCK_HISTORY, MOCK_RX_INBOX, MOCK_STOCK_TRANSACTIONS,
  BackendSyncController, BackendShiftController, BackendWardController,
  BackendMARController, BackendComplianceController
} from './mockData';
import {
  User, Patient, MedicalRecord, VitalSign, MedicalOrder,
  OrderType, OrderStatus, SurgeryGroupStatus, SurgeryOrderStatus,
  ShiftType, ShiftStatus, MARStatus, MedVisitStatus, MedGroupStatus,
  IssueNoteStatus, StockTransactionType, RxChangeType,
  ComplianceStats, ComplianceIssue, WardStockItem, IssueNote,
  RxInboxItem, SyncQueueItem, SyncStatus,
  MedicalRecordMain, MedicalRecordConclusion, Attachment,
  MedicationDeliveryProof, ReasonCode,
  MedOrderStatus
} from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- AUTH ---
  login: async (username: string): Promise<User | undefined> => {
    await delay(500);
    const userWithPass = MOCK_USERS.find(u => u.username === username);
    if (userWithPass) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...user } = userWithPass;
        return user;
    }
    return undefined;
  },
  
  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
      await delay(500);
      const user = MOCK_USERS.find(u => u.id === id);
      if (!user) throw new Error("User not found");
      Object.assign(user, data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;
      return safeUser;
  },

  // --- PATIENTS ---
  getPatients: async (): Promise<Patient[]> => {
    await delay(500);
    return MOCK_PATIENTS;
  },
  getPatientById: async (id: string): Promise<Patient | undefined> => {
    await delay(300);
    return MOCK_PATIENTS.find(p => p.id === id);
  },

  // --- MEDICAL RECORDS ---
  getMedicalRecord: async (patientId: string): Promise<MedicalRecord | undefined> => {
    await delay(300);
    return MOCK_MEDICAL_RECORDS.find(r => r.patientId === patientId) as unknown as MedicalRecord;
  },
  updateMedicalRecord: async (patientId: string, data: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    await delay(500);
    const record = MOCK_MEDICAL_RECORDS.find(r => r.patientId === patientId);
    if (!record) throw new Error("Record not found");
    Object.assign(record, data);
    return record as unknown as MedicalRecord;
  },
  uploadAttachment: async (patientId: string, file: File): Promise<Attachment> => {
      await delay(1000);
      return {
          id: Math.random().toString(),
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type.includes('pdf') ? 'pdf' : 'image',
          uploadDate: new Date().toISOString()
      };
  },

  // --- VITALS ---
  getVitals: async (patientId: string): Promise<VitalSign[]> => {
    await delay(300);
    return MOCK_VITALS.filter(v => v.patientId === patientId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  createVital: async (vital: VitalSign): Promise<VitalSign> => {
      await delay(300);
      MOCK_VITALS.unshift(vital as any);
      return vital;
  },

  // --- NOTES ---
  getNotes: async (patientId: string) => {
    await delay(300);
    return MOCK_NOTES.filter(n => n.patientId === patientId);
  },

  // --- ORDERS ---
  getOrders: async (patientId: string): Promise<MedicalOrder[]> => {
    await delay(300);
    return MOCK_ORDERS.filter(o => o.patientId === patientId);
  },
  createOrder: async (order: MedicalOrder): Promise<MedicalOrder> => {
      await delay(300);
      MOCK_ORDERS.unshift(order);
      return order;
  },
  
  // --- SERVICES (LAB/PROCEDURE) ---
  startService: async (orderId: string) => {
      await delay(300);
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      if (order) {
          order.status = OrderStatus.IN_PROGRESS;
          order.executedAt = new Date().toISOString(); // Start time
      }
      return order;
  },
  completeService: async (orderId: string, result: string, signature: string, byUserId: string) => {
      await delay(500);
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      if (order) {
          order.status = OrderStatus.COMPLETED;
          order.result = result;
          order.patientSignature = signature;
          order.executedBy = byUserId;
          order.executedAt = new Date().toISOString(); // End time
      }
      return order;
  },
  saveOrderObs: async (data: { orderId: string, values: any }) => {
      await delay(300);
      const order = MOCK_ORDERS.find(o => o.id === data.orderId);
      if (order) {
          Object.assign(order, data.values);
      }
      return order;
  },

  // --- MEDICATION (DISPENSING) ---
  dispenseMedication: async (orderId: string, signature: string, byUserId: string) => {
      await delay(300);
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      if (order) {
          order.status = OrderStatus.COMPLETED;
          order.patientSignature = signature;
          order.executedBy = byUserId;
          order.executedAt = new Date().toISOString();
      }
      return order;
  },

  // --- TREATMENT MODULE ---
  getTreatments: async (params: { deptCode?: string, status?: string, keyword?: string }) => {
      await delay(400);
      let list = MOCK_TREATMENTS;
      if (params.deptCode) list = list.filter(t => t.deptCode === params.deptCode);
      if (params.status) list = list.filter(t => t.status === params.status);
      if (params.keyword) {
          const kw = params.keyword.toLowerCase();
          list = list.filter(t => t.patientName.toLowerCase().includes(kw) || t.patientCode.toLowerCase().includes(kw));
      }
      return list;
  },
  getTreatmentDetail: async (id: string) => {
      await delay(300);
      return MOCK_TREATMENTS.find(t => t.id === id);
  },
  getTreatmentHistory: async (patientId: string) => {
      await delay(300);
      return MOCK_HISTORY; // Mock returning all history for demo
  },

  // --- MEDICAL RECORD FORMS ---
  getMedicalRecordPage1: async (recordId: string) => {
      await delay(200);
      // @ts-ignore
      return MOCK_RECORD_PAGES[recordId]?.page1 || MOCK_RECORD_PAGES['mr_t1'].page1;
  },
  getMedicalRecordMain: async (recordId: string) => {
      await delay(200);
      // @ts-ignore
      return MOCK_RECORD_PAGES[recordId]?.main || MOCK_RECORD_PAGES['mr_t1'].main;
  },
  getMedicalRecordConclusion: async (recordId: string) => {
      await delay(200);
      // @ts-ignore
      return MOCK_RECORD_PAGES[recordId]?.conclusion || MOCK_RECORD_PAGES['mr_t1'].conclusion;
  },
  updateMedicalRecordMain: async (recordId: string, data: MedicalRecordMain) => {
      await delay(500);
      return data;
  },
  updateMedicalRecordConclusion: async (recordId: string, data: MedicalRecordConclusion) => {
      await delay(500);
      return data;
  },
  
  // --- DOCUMENTS ---
  getRecordCategories: async () => {
      await delay(200);
      return [
          { code: 'HSO', name: 'Hồ sơ bệnh án', children: [{code: 'BA_NOITRU', name: 'Bệnh án nội trú'}, {code: 'PHIEU_KHAM', name: 'Phiếu khám bệnh'}] },
          { code: 'CLS', name: 'Kết quả CLS', children: [{code: 'PHIEU_XET_NGHIEM', name: 'Phiếu xét nghiệm'}, {code: 'PHIEU_CDHA', name: 'Chẩn đoán hình ảnh'}] },
          { code: 'HC', name: 'Giấy tờ hành chính', children: [{code: 'BHYT', name: 'Thẻ BHYT'}, {code: 'CCCD', name: 'CCCD/CMND'}] }
      ];
  },
  getStorageFiles: async (aggregateId: string, category: string) => {
      await delay(300);
      return MOCK_FILES.filter(f => f.aggregateId === aggregateId || f.category === category); // Simplified filter
  },
  uploadFile: async (aggregateId: string, category: string, file: File) => {
      await delay(1000);
      const newFile = {
          id: Math.random().toString(),
          aggregateId,
          category,
          name: file.name,
          url: '#',
          extension: file.name.split('.').pop() || '',
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          uploadDate: new Date().toISOString(),
          uploadedBy: 'u1'
      };
      MOCK_FILES.push(newFile);
      return newFile;
  },

  // --- SURGERY / DVKT ---
  searchSurgeryGroups: async (params: { fulfillDeptCode?: string, keyword?: string }) => {
      await delay(400);
      let list = MOCK_SURGERY_GROUPS;
      if (params.fulfillDeptCode) list = list.filter(g => g.fulfillDeptCode === params.fulfillDeptCode);
      if (params.keyword) {
          const kw = params.keyword.toLowerCase();
          list = list.filter(g => g.patientName.toLowerCase().includes(kw));
      }
      return list;
  },
  getSurgeryGroupDetail: async (id: string) => {
      await delay(300);
      return MOCK_SURGERY_GROUPS.find(g => g.id === id);
  },
  getSurgeryGroupPatient: async (id: string) => {
      await delay(300);
      const group = MOCK_SURGERY_GROUPS.find(g => g.id === id);
      return {
          name: group?.patientName || '',
          code: group?.patientCode || '',
          dob: group?.patientDob || '',
          gender: group?.patientGender || '',
          visitInfo: {
              dept: group?.indicationDept,
              diagnosis: group?.diagnosis,
              admissionDate: group?.indicationDate
          }
      };
  },
  updateSurgeryExecutionTime: async (orderId: string, start: boolean) => {
      await delay(300);
      const group = MOCK_SURGERY_GROUPS.find(g => g.orders.some(o => o.id === orderId));
      const order = group?.orders.find(o => o.id === orderId);
      if (order) {
          if (start) {
              order.status = SurgeryOrderStatus.EXECUTING;
              // @ts-ignore
              order.executionStartTime = new Date().toISOString();
          } else {
              // Cancel execution
              order.status = SurgeryOrderStatus.NEW;
              // @ts-ignore
              order.executionStartTime = undefined;
          }
      }
      return order;
  },
  saveSurgeryObs: async (data: { orderId: string, patientId: string, values: any }) => {
      await delay(300);
      const group = MOCK_SURGERY_GROUPS.find(g => g.orders.some(o => o.id === data.orderId));
      const order = group?.orders.find(o => o.id === data.orderId);
      if (order) {
          order.obs = { ...order.obs, ...data.values };
      }
      return order;
  },
  releaseSurgeryResult: async (orderId: string) => {
      await delay(300);
      const group = MOCK_SURGERY_GROUPS.find(g => g.orders.some(o => o.id === orderId));
      const order = group?.orders.find(o => o.id === orderId);
      if (order) {
          order.status = SurgeryOrderStatus.RESULT;
          // @ts-ignore
          order.executionEndTime = new Date().toISOString();
      }
      return order;
  },
  revokeSurgeryResult: async (orderId: string) => {
      await delay(300);
      const group = MOCK_SURGERY_GROUPS.find(g => g.orders.some(o => o.id === orderId));
      const order = group?.orders.find(o => o.id === orderId);
      if (order) {
          order.status = SurgeryOrderStatus.EXECUTING; // Back to Executing
      }
      return order;
  },
  cancelSurgeryOrder: async (orderId: string) => {
      await delay(300);
      const group = MOCK_SURGERY_GROUPS.find(g => g.orders.some(o => o.id === orderId));
      const order = group?.orders.find(o => o.id === orderId);
      if (order) {
          order.status = SurgeryOrderStatus.CANCELED;
      }
      return order;
  },

  // --- MAR / MEDICATION ---
  getMARPatients: async (params?: { fromDate?: string, toDate?: string, deptCode?: string }) => {
      await delay(500);
      let visits = MOCK_MED_VISITS;
      if (params?.deptCode) {
          visits = visits.filter(v => v.deptCode === params.deptCode);
      }
      
      // Filter Simulation: If date range is provided and does NOT include today,
      // simulate no active data (since mock data is static "Today's data").
      if (params?.fromDate && params?.toDate) {
          const today = new Date().toISOString().split('T')[0];
          if (today < params.fromDate || today > params.toDate) {
              return visits.map(v => ({
                  ...v,
                  marSummary: { total: 0, pending: 0, missed: 0, returnPending: 0 }
              }));
          }
      }

      return visits.map(v => {
          const items = MOCK_MAR.filter(m => m.visitId === v.id);
          return {
              ...v,
              marSummary: {
                  total: items.length,
                  pending: items.filter(m => m.status === MARStatus.SCHEDULED).length,
                  missed: items.filter(m => m.status === MARStatus.MISSED).length,
                  returnPending: items.filter(m => m.status === MARStatus.RETURN_PENDING).length
              }
          };
      });
  },
  getShiftSummary: async (shift: ShiftType) => {
      await delay(300);
      return BackendShiftController.getShiftSummary(shift);
  },
  closeShift: async (shift: ShiftType) => {
      await delay(800);
      return BackendShiftController.closeShift(shift);
  },
  reopenShift: async (shift: ShiftType, reason: string) => {
      await delay(500);
      return BackendShiftController.reopenShift(shift, reason);
  },
  getMARByVisit: async (visitId: string) => {
      await delay(300);
      return MOCK_MAR.filter(m => m.visitId === visitId);
  },
  updateMARStatus: async (id: string, status: MARStatus, data: any) => {
      await delay(400);
      return BackendMARController.updateMARStatus(id, status, data);
  },
  getMARReasonCodes: async (): Promise<ReasonCode[]> => {
      await delay(200);
      return MOCK_REASON_CODES;
  },

  // --- WARD STOCK ---
  getWardStock: async (): Promise<WardStockItem[]> => {
      await delay(300);
      return MOCK_WARD_STOCK;
  },
  getIssueNotes: async (params: { from: string, to: string, status: string }): Promise<IssueNote[]> => {
      await delay(300);
      let notes = MOCK_ISSUE_NOTES;
      if (params.status) notes = notes.filter(n => n.status === params.status);
      return notes;
  },
  confirmIssueNote: async (id: string, items: any[]) => {
      await delay(800);
      return BackendWardController.confirmIssueNote(id, items);
  },
  getWardStockHistory: async (drugCode: string) => {
      await delay(300);
      return MOCK_STOCK_TRANSACTIONS.filter(t => t.drugCode === drugCode);
  },
  adjustWardStock: async (drugCode: string, qty: number, reason: string) => {
      await delay(500);
      return BackendWardController.adjustStock(drugCode, qty, reason);
  },
  getReturnsPending: async () => {
      await delay(300);
      return MOCK_MAR.filter(m => m.status === MARStatus.RETURN_PENDING);
  },

  // --- RX INBOX ---
  getRxInbox: async (): Promise<RxInboxItem[]> => {
      await delay(400);
      return MOCK_RX_INBOX;
  },
  applyRxUpdate: async (patientId: string) => {
      await delay(800);
      return BackendMARController.freezeRxVersion(patientId);
  },

  // --- DASHBOARDS ---
  getMedicationDashboardStats: async (params: any) => {
      await delay(500);
      // Mock stats
      const pendingGroups = MOCK_MED_GROUPS.filter(g => g.status === MedGroupStatus.RELEASED);
      const pendingVisits = MOCK_MED_VISITS.filter(v => v.status !== MedVisitStatus.FULLY_DISPENSED);
      const pendingItems = MOCK_MED_ORDERS.filter(o => o.status !== MedOrderStatus.DISPENSED);

      return { pendingGroups, pendingVisits, pendingItems };
  },
  getRoundDashboardStats: async () => {
      await delay(500);
      // Mock stats
      return {
          shift: { name: 'Sáng', start: new Date().setHours(6,0,0,0), end: new Date().setHours(12,0,0,0) },
          summary: { total: 10, nurseDone: 4, doctorDone: 3 },
          patients: MOCK_PATIENTS.map(p => ({
              patientId: p.id,
              patientName: p.name,
              patientCode: p.code,
              room: p.room,
              bed: p.bed,
              nurseStatus: { isDone: Math.random() > 0.5, hasVitals: true, hasCare: true },
              doctorStatus: { isDone: Math.random() > 0.5, hasExam: true, hasOrder: true }
          })),
          deptStats: [
              { deptCode: 'NOI1', total: 5, nurseDone: 2, nursePercent: 40, doctorDone: 2, doctorPercent: 40 },
              { deptCode: 'NGOAI', total: 5, nurseDone: 2, nursePercent: 40, doctorDone: 1, doctorPercent: 20 }
          ]
      };
  },
  getComplianceStats: async (shift: ShiftType): Promise<ComplianceStats> => {
      await delay(500);
      return BackendComplianceController.getStats(shift);
  },

  // --- SYNC ---
  getSyncQueue: async (): Promise<SyncQueueItem[]> => {
      await delay(300);
      return BackendSyncController.getQueue();
  },
  processSyncQueue: async () => {
      await delay(1000);
      return BackendSyncController.processQueue();
  },
  retrySyncItem: async (id: string) => {
      await delay(500);
      return BackendSyncController.retryItem(id);
  },
  
  // --- AI ---
  askAssistant: async (context: any, query: string) => {
      await delay(1000);
      return { text: "Đây là câu trả lời mô phỏng từ AI cho: " + query };
  }
};
