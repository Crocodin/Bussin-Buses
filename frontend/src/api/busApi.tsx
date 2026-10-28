import { api } from "./baseApi";
import { BusObject, BusFilter } from "../domain/BusObject";

export async function fetchBuses(params: BusFilter = {}): Promise<BusObject[]> {
  const res = await api.get<BusObject[]>("/buses", { params });
  return res.data;
}

export async function fetchBus(id: string): Promise<BusObject> {
  const res = await api.get<BusObject>(`/buses/${id}`);
  return res.data;
}

export async function postBus(name: string, description: string, images: File[]): Promise<BusObject> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  images.forEach((file) => formData.append('images', file));

  const res = await api.post<BusObject>("/buses", formData, {
    timeout: 60000, // uploads are slower than normal calls
  });
  return res.data;
}