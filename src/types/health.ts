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
}
