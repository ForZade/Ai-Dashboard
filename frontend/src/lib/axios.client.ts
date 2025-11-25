import axios, { AxiosInstance } from 'axios';

interface CustomAxiosInstance extends AxiosInstance {
  setAccessToken: (token: string) => void;
}

let accessToken: string | null = null;

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    withCredentials: true,
}) as CustomAxiosInstance;

api.interceptors.request.use(config => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(res => {
        const newToken = res.headers["x-access-token"];

        if (newToken) {
            accessToken = newToken;
        }

        return res;
    },
    err => {
        const res = err.response;

        if (res?.status === 401 && res?.code === "UNAUTHORIZED") {
            window.location.replace("/login");
            return Promise.reject(err);
        }

        return Promise.reject(err);
    }
);

// Only created this for cases I use SSR where I need to replace access token manually.
api.setAccessToken = (token: string) => {
    accessToken = token;
}

