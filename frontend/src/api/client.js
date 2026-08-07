import axios from "axios";

export const api = axios.create({ baseURL: "/" });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Fetch a file through the authenticated client and trigger a browser download.
export async function downloadBlob(url) {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = blobUrl;
  const disposition = res.headers?.["content-disposition"] ?? "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  a.download = match ? match[1] : "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
