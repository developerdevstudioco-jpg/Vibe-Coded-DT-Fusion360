import axios from 'axios';
import { backendUrl } from "../configs/config.js"

// Create a simple Axios instance without auth
const apiClient = axios.create({
  baseURL: backendUrl,
});

export default apiClient;