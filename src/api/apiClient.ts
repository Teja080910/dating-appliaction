import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { APIURL } from '../environment/ApiConfig';
import { AuthStorage } from './authStorage';

const apiClient: AxiosInstance = axios.create({
  baseURL: APIURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AuthStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AuthStorage.clear();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
