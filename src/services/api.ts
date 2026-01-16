
import {
  MOCK_USERS, MOCK_PATIENTS, MOCK_REASON_CODES, MOCK_TREATMENTS,
  MOCK_MEDICAL_RECORDS, MOCK_RECORD_PAGES, MOCK_VITALS, MOCK_NOTES,
  MOCK_ORDERS, MOCK_SURGERY_GROUPS, MOCK_WARD_STOCK, MOCK_ISSUE_NOTES,
  MOCK_MED_VISITS, MOCK_MED_GROUPS, MOCK_MED_ORDERS, MOCK_MAR,
  MOCK_FILES, MOCK_HISTORY, MOCK_RX_INBOX, MOCK_STOCK_TRANSACTIONS,
  MOCK_SYNC_QUEUE,
  BackendSyncController, BackendShiftController, BackendWardController,
  BackendMARController, BackendComplianceController
} from './mockData';
import {
  User, Patient, MedicalRecord, VitalSign, MedicalOrder,
  OrderType, OrderStatus, SurgeryGroupStatus, SurgeryOrderStatus,
  ShiftType, ShiftStatus, MARStatus, MedVisitStatus, 
  IssueNoteStatus, StockTransactionType, RxChangeType,
  ComplianceStats, WardStockItem, IssueNote,
  RxInboxItem, SyncQueueItem, SyncStatus,
  MedicalRecordMain, MedicalRecordConclusion, Attachment,
  MedicationDeliveryProof, ReasonCode, RecordCategory, ProgressNote
} from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  login: async (username: string): Promise<User | undefined> => {
    await delay(500);
    const userWithPass = MOCK_USERS.find(u => u.username === username);
    if (userWithPass) {
        const { password, ...user } = userWithPass;
        return user as User;
    }
    return undefined;
  },
  
  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
      await delay(500);
      const user = MOCK_USERS.find(u => u.id === id);
      if (!user) throw new Error("User not found");
      Object.assign(user, data);
      const { password, ...safeUser } = user;
      return safeUser as User;
  },

  getPatients: async (): Promise<Patient[]> => {
    await delay(500);
    return MOCK_PATIENTS;
  },

  getPatientById: async (id: string): Promise<Patient | undefined> => {
    await delay(300);
    return MOCK_PATIENTS.find(p => p.id === id);
  },

  getMARPatients: async (params?: { fromDate?: string, toDate?: string, deptCode?: string, patientId?: string, hasMedication?: boolean }) => {
      await delay(500);
      let visits = MOCK_MED_VISITS;
      
      if (params?.patientId) {
          visits = visits.filter(v => v.patientId === params.patientId);
      }

      if (params?.hasMedication) {
          visits = visits.filter(v => v.lastMedicationOrderAt !== undefined);
      }

      if (params?.deptCode) {
          visits = visits.filter(v => v.deptCode === params.deptCode);
      }

      return visits.map(v => {
          const items = MOCK_MAR.filter(m => m.visitId === v.id);
          
          const shiftsSummary: any = {};
          [ShiftType.MORNING, ShiftType.NOON, ShiftType.AFTERNOON, ShiftType.NIGHT].forEach(shift => {
              const shiftItems = items.filter(m => m.shift === shift);
              shiftsSummary[shift] = {
                  used: shiftItems.filter(m => m.status === MARStatus.ADMINISTERED).length,
                  pending: shiftItems.filter(m => m.status === MARStatus.SCHEDULED).length,
                  returned: shiftItems.filter(m => m.status === MARStatus.RETURN_PENDING).length
              };
          });

          return {
              ...v,
              marSummary: {
                  total: items.length,
                  pending: items.filter(m => m.status === MARStatus.SCHEDULED).length,
                  missed: items.filter(m => m.status === MARStatus.MISSED).length,
                  returnPending: items.filter(m => m.status === MARStatus.RETURN_PENDING).length,
                  shifts: shiftsSummary
              }
          };
      });
  },

  getMARByVisit: async (visitId: string) => {
      await delay(300);
      return MOCK_MAR.filter(m => m.visitId === visitId);
  },

  updateMARStatus: async (id: string, status: MARStatus, data: any) => {
      await delay(400);
      return BackendMARController.updateMARStatus(id, status, data);
  },

  getShiftSummary: async (shift: ShiftType) => {
      await delay(300);
      return BackendShiftController.getShiftSummary(shift);
  },

  closeShift: async (shift: ShiftType) => {
      await delay(800);
      return BackendShiftController.closeShift(shift);
  },

  getWardStock: async (): Promise<WardStockItem[]> => {
      await delay(300);
      return MOCK_WARD_STOCK;
  },

  getTreatmentDetail: async (id: string) => {
      await delay(300);
      return MOCK_TREATMENTS.find(t => t.id === id);
  },

  getTreatmentHistory: async (patientId: string) => {
      await delay(300);
      return MOCK_HISTORY;
  },

  getMedicalRecordPage1: async (recordId: string) => {
      await delay(200);
      return MOCK_RECORD_PAGES[recordId]?.page1 || {};
  },

  getMedicalRecordMain: async (recordId: string) => {
      await delay(200);
      return MOCK_RECORD_PAGES[recordId]?.main || {};
  },

  getMedicalRecordConclusion: async (recordId: string) => {
      await delay(200);
      return MOCK_RECORD_PAGES[recordId]?.conclusion || {};
  },

  updateMedicalRecordMain: async (recordId: string, data: MedicalRecordMain) => {
      await delay(500);
      return data;
  },

  updateMedicalRecordConclusion: async (recordId: string, data: MedicalRecordConclusion) => {
      await delay(500);
      return data;
  },

  getRecordCategories: async (): Promise<RecordCategory[]> => {
      await delay(200);
      return [
          { code: 'HSO', name: 'Hồ sơ bệnh án', children: [{code: 'BA_NOITRU', name: 'Bệnh án nội trú'}] },
          { code: 'HC', name: 'Giấy tờ hành chính', children: [{code: 'BHYT', name: 'Thẻ BHYT'}, {code: 'CCCD', name: 'CCCD'}] }
      ];
  },

  getStorageFiles: async (aggregateId: string, category: string) => {
      await delay(300);
      return MOCK_FILES.filter(f => f.aggregateId === aggregateId);
  },

  uploadFile: async (aggregateId: string, category: string, file: File) => {
      await delay(800);
      return { id: Math.random().toString(), name: file.name, uploadDate: new Date().toISOString(), size: '1MB' };
  },

  getSyncQueue: async (): Promise<SyncQueueItem[]> => {
      await delay(300);
      return MOCK_SYNC_QUEUE;
  },

  processSyncQueue: async () => {
      await delay(1000);
      return BackendSyncController.processQueue();
  },

  retrySyncItem: async (id: string) => {
      await delay(500);
      return BackendSyncController.retryItem(id);
  },

  getMedicalRecord: async (patientId: string): Promise<MedicalRecord | undefined> => {
      await delay(300);
      return MOCK_MEDICAL_RECORDS.find(r => r.patientId === patientId);
  },

  getVitals: async (patientId: string): Promise<VitalSign[]> => {
      await delay(300);
      return MOCK_VITALS.filter(v => v.patientId === patientId);
  },

  getOrders: async (patientId: string): Promise<MedicalOrder[]> => {
      await delay(300);
      return MOCK_ORDERS.filter(o => o.patientId === patientId);
  },

  getNotes: async (patientId: string): Promise<ProgressNote[]> => {
      await delay(300);
      return MOCK_NOTES.filter(n => n.patientId === patientId);
  },

  createVital: async (data: VitalSign) => {
      await delay(400);
      MOCK_VITALS.unshift(data);
      return data;
  },

  searchSurgeryGroups: async (params: { fulfillDeptCode: string, keyword: string }) => {
      await delay(500);
      return MOCK_SURGERY_GROUPS.filter(g => g.fulfillDeptCode === params.fulfillDeptCode);
  },

  getSurgeryGroupDetail: async (id: string) => {
      await delay(300);
      return MOCK_SURGERY_GROUPS.find(g => g.id === id);
  },

  getSurgeryGroupPatient: async (id: string) => {
      await delay(300);
      return MOCK_PATIENTS[0]; 
  },

  updateSurgeryExecutionTime: async (orderId: string, start: boolean) => {
      await delay(400);
      return { success: true };
  },

  saveSurgeryObs: async (params: { orderId: string, patientId: string, values: any }) => {
      await delay(400);
      return { success: true };
  },

  releaseSurgeryResult: async (orderId: string) => {
      await delay(400);
      return { success: true };
  },

  revokeSurgeryResult: async (orderId: string) => {
      await delay(400);
      return { success: true };
  },

  cancelSurgeryOrder: async (orderId: string) => {
      await delay(400);
      return { success: true };
  },

  getTreatments: async (params: { deptCode: string, status?: string, keyword?: string }) => {
      await delay(500);
      return MOCK_TREATMENTS;
  },

  getMedicationDashboardStats: async (params: { deptCode: string, keyword: string }) => {
      await delay(500);
      let groups = MOCK_MED_GROUPS;
      if (params.keyword) {
          groups = groups.filter(g => 
              g.patientName.toLowerCase().includes(params.keyword.toLowerCase()) || 
              g.patientCode.includes(params.keyword)
          );
      }
      return { pendingGroups: groups };
  },

  getRoundDashboardStats: async () => {
      await delay(500);
      return {
          shift: { name: 'Sáng', start: new Date().toISOString(), end: new Date().toISOString() },
          summary: { total: 10, nurseDone: 5, doctorDone: 3 },
          patients: [],
          deptStats: []
      };
  },

  getIssueNotes: async (params: { from: string, to: string, status: string }) => {
      await delay(500);
      return MOCK_ISSUE_NOTES;
  },

  confirmIssueNote: async (id: string, items: any[]) => {
      await delay(500);
      return BackendWardController.confirmIssueNote(id, items);
  },

  getWardStockHistory: async (drugCode: string) => {
      await delay(400);
      return MOCK_STOCK_TRANSACTIONS.filter(t => t.drugCode === drugCode);
  },

  getReturnsPending: async () => {
      await delay(300);
      return MOCK_MAR.filter(m => m.status === MARStatus.RETURN_PENDING);
  },

  getMARReasonCodes: async () => {
      await delay(200);
      return MOCK_REASON_CODES;
  },

  adjustWardStock: async (drugCode: string, qty: number, reason: string) => {
      await delay(500);
      return BackendWardController.adjustStock(drugCode, qty, reason);
  },

  getRxInbox: async (): Promise<RxInboxItem[]> => {
      await delay(500);
      return MOCK_RX_INBOX;
  },

  applyRxUpdate: async (patientId: string) => {
      await delay(800);
      return { success: true };
  },

  getComplianceStats: async (shift: ShiftType): Promise<ComplianceStats> => {
      await delay(300);
      return BackendComplianceController.getStats(shift);
  }
};
