import { api } from "./baseApi";
import UserObject from "../domain/UserObject";

export interface LoginResponse {
  access_token: string;
  user: UserObject;
}

export async function registerUser(username: string, email: string, password: string): Promise<void> {
  await api.post("/register", { username, email, password });
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/login", { email, password });
  return res.data;
}