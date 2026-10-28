import UserObject from './UserObject';

interface BusObject {
  id: number;
  name: string;
  description: string;
  imageUrls: string[];
  location: string;
  user: UserObject;
  timestamp: string;
}

interface BusFilter {
  beforeId?: number
  before?: string;
  search?: string;
  limit?: number;
  id?: number;
}

interface NewBusInput {
  name: string;
  description: string;
  images: File[];
}

export type { BusObject, BusFilter, NewBusInput };