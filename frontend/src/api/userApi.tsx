import UserObject from "../domain/UserObject";
import { api } from "./baseApi";

export async function changeProfileImagine(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await api.put<UserObject>("/users/me/picture", formData, {
    timeout: 60000, 
  });
  return res.data;
}