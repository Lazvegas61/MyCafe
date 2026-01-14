// /home/qw/Desktop/MyCafe/admin-ui/src/api/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:3000", // NestJS backend adresi
});

export default api;

