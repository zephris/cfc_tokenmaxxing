import axios from "axios";

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
	timeout: 90_000,
});

export default api;
