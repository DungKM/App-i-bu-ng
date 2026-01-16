
import { GoogleGenAI } from "@google/genai";
import { Patient, MedicalRecord, VitalSign, MedicalOrder, ProgressNote } from "@/types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface PatientContext {
  patient: Patient;
  record?: MedicalRecord;
  vitals?: VitalSign[];
  orders?: MedicalOrder[];
  notes?: ProgressNote[];
}

export const aiService = {
  askAssistant: async (context: PatientContext, query: string): Promise<string> => {
    try {
      const prompt = `
        Bối cảnh bệnh nhân:
        - Tên: ${context.patient.name}, Giới tính: ${context.patient.gender}
        - Chẩn đoán: ${context.patient.diagnosis}
        - Tiền sử: ${context.record?.medicalHistory || 'N/A'}
        - Sinh hiệu gần nhất: ${context.vitals?.length ? JSON.stringify(context.vitals[0]) : 'N/A'}
        - Thuốc đang dùng: ${context.orders?.filter(o => o.type === 'MEDICATION').map(o => o.content).join(', ') || 'N/A'}
        - Diễn biến mới nhất: ${context.notes?.length ? context.notes[0].content : 'N/A'}

        Câu hỏi từ nhân viên y tế: ${query}

        Hãy trả lời bằng tiếng Việt chuyên môn y khoa, ngắn gọn, súc tích và tập trung vào hỗ trợ lâm sàng.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một trợ lý ảo y tế cao cấp chuyên hỗ trợ bác sĩ nội trú. Bạn phân tích dữ liệu lâm sàng và cung cấp các gợi ý an toàn.",
          temperature: 0.7,
        },
      });

      return response.text || "Xin lỗi, tôi không thể phân tích lúc này.";
    } catch (error) {
      console.error("Gemini AI Error:", error);
      return "Lỗi kết nối AI.";
    }
  },

  getClinicalSummary: async (context: PatientContext): Promise<string> => {
    try {
      const prompt = `
        Tóm tắt bệnh án BN ${context.patient.name} (${context.patient.diagnosis}) trong tối đa 3-4 gạch đầu dòng.
        1. Tình trạng hiện tại.
        2. Rủi ro cần chú ý.
        3. Các việc cần làm ngay.
        
        Dữ liệu: ${JSON.stringify(context)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Tóm tắt bệnh án chuyên nghiệp, ngắn gọn.",
          temperature: 0.3,
        }
      });

      return response.text || "Chưa có tóm tắt.";
    } catch (error) {
      return "Không thể tạo tóm tắt lâm sàng.";
    }
  }
};
