export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  image: string;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'mama';
  timestamp: Date;
  attachment_id?: string;
  attachment_type?: 'image' | 'pdf' | 'document';
}

// Tipos para el sistema de chat persistente
export interface Conversation {
  id: string;
  patient_id: string;
  user_id: string;
  context: Record<string, any>;
  started_at: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'mama';
  attachment_id: string | null;
  attachment_type: 'image' | 'pdf' | 'document' | null;
  message_type: 'text' | 'file' | 'system';
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

// Estructura JSON de respuesta del bot "Mama"
export interface BotResponse {
  // Respuesta de texto para el usuario
  message: string;
  
  // Metadatos del análisis (si hay archivo adjunto)
  analysis?: {
    file_id: string; // ID del medical_file analizado
    reliability_score: number; // 1-100, calculado por el bot
    document_type?: 'certificate' | 'lab_result' | 'prescription' | 'medical_record' | 'other';
    extracted_data?: Record<string, any>; // Datos extraídos del documento (opcional)
  };
  
  // Contexto de la conversación (para mantener estado)
  context_update?: {
    symptoms?: string[];
    severity?: 'leve' | 'moderado' | 'grave';
    duration?: string;
    [key: string]: any; // Otros campos de contexto
  };
}
