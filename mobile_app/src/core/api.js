import { Platform } from 'react-native';
import { StorageService } from './storage';

// --- KONFIGURASI ALAMAT SERVER API ---
// Menggunakan active tunnel Ngrok resmi proyek
const USE_TUNNEL = true;
const TUNNEL_URL = 'https://carried-ended-deplored.ngrok-free.dev';

// Wi-Fi lokal (jika satu jaringan Wi-Fi dan firewall mengizinkan)
const SERVER_IP = '192.168.1.9';
const USE_EMULATOR = false;

export const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : (USE_TUNNEL
      ? TUNNEL_URL
      : (USE_EMULATOR && Platform.OS === 'android'
          ? 'http://10.0.2.2:8000'
          : `http://${SERVER_IP}:8000`));
export const API_URL = `${BASE_URL}/api`;

export const getImageUrl = (url) => {
  if (!url) return null;
  // Jika sudah berupa URL lengkap (http/https), kembalikan langsung
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  let cleanPath = url.startsWith('/') ? url.substring(1) : url;
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.substring(8);
  }
  return `${BASE_URL}/media/${cleanPath}`;
};

export const getImageUrlObject = (url) => {
  const fullUrl = getImageUrl(url);
  if (!fullUrl) return null;
  return {
    uri: fullUrl,
    headers: {
      'ngrok-skip-browser-warning': '69420',
      'Bypass-Tunnel-Reminder': 'true',
      'bypass-tunnel-reminder': '1',
    },
  };
};

const getHeaders = async (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  headers['Accept'] = 'application/json';

  // Lewati halaman peringatan Ngrok / Localtunnel
  headers['ngrok-skip-browser-warning'] = '69420';
  headers['Bypass-Tunnel-Reminder'] = 'true';
  headers['bypass-tunnel-reminder'] = '1';

  const token = await StorageService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Fetch dengan timeout 25 detik agar tidak terjadi hang saat tunnel/jaringan lambat
const fetchWithTimeout = async (url, options = {}, timeoutMs = 25000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/**
 * Cek apakah error adalah AbortError (request di-cancel/timeout atau socket reset).
 * AbortError bersifat "expected" saat tunnel Ngrok sesaat putus/reconnect
 * dan TIDAK perlu di-log sebagai error merah di konsol.
 */
export const isAbortError = (err) =>
  err?.name === 'AbortError' ||
  err?.message === 'Aborted' ||
  err?.message?.toLowerCase?.()?.includes('aborted') ||
  err?.message?.toLowerCase?.()?.includes('network request failed') ||
  err?.message?.toLowerCase?.()?.includes('failed to fetch');


export const ApiService = {
  async get(endpoint) {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return response;
  },

  // Public GET — no auth token, used before login (e.g. registration address lookup)
  async getPublic(endpoint) {
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        'Bypass-Tunnel-Reminder': 'true',
        'bypass-tunnel-reminder': '1',
      },
    });
    return response;
  },

  async post(endpoint, body) {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return response;
  },

  async put(endpoint, body) {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return response;
  },

  async delete(endpoint) {
    const headers = await getHeaders();
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return response;
  },

  // File upload for payment proof
  async postMultipart(endpoint, fileUri, fieldName) {
    const headers = await getHeaders(true); // Is multipart, do not set Content-Type

    const formData = new FormData();
    let filename = fileUri.split('/').pop() || 'payment_proof.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    if (!match) {
      filename = `${filename}.jpg`;
    }
    const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    formData.append(fieldName, {
      uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
      name: filename,
      type: type,
    });

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return response;
  },

  // File upload with fields (for registration with KTP photo)
  async postRegisterMultipart(endpoint, fields, fileUri, fieldName = 'ktp_photo') {
    const headers = await getHeaders(true); // Is multipart, do not set Content-Type

    const formData = new FormData();
    
    // Append standard fields
    Object.keys(fields).forEach(key => {
      if (fields[key] !== null && fields[key] !== undefined) {
        formData.append(key, String(fields[key]));
      }
    });

    // Append KTP photo if provided
    if (fileUri) {
      let filename = fileUri.split('/').pop() || 'ktp_photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      if (!match) {
        filename = `${filename}.jpg`;
      }
      const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      formData.append(fieldName, {
        uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
        name: filename,
        type: type,
      });
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return response;
  },

  // File upload with fields (for products creation/update)
  async postProductMultipart(endpoint, fields, fileUri = null, fieldName = 'image') {
    const headers = await getHeaders(true); // Is multipart, do not set Content-Type

    const formData = new FormData();
    
    // Append standard fields
    Object.keys(fields).forEach(key => {
      if (fields[key] !== null && fields[key] !== undefined) {
        formData.append(key, String(fields[key]));
      }
    });

    // Append image if provided
    if (fileUri) {
      let filename = fileUri.split('/').pop() || 'product.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      if (!match) {
        filename = `${filename}.jpg`;
      }
      const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      formData.append(fieldName, {
        uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
        name: filename,
        type: type,
      });
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return response;
  },

  // Profile update multipart (with optional photo upload)
  async putProfileMultipart(endpoint, fields, fileUri = null) {
    const headers = await getHeaders(true);

    const formData = new FormData();

    // Laravel needs _method=PUT trick for multipart form-data
    formData.append('_method', 'PUT');

    // Append standard text fields
    Object.keys(fields).forEach(key => {
      if (fields[key] !== null && fields[key] !== undefined) {
        formData.append(key, String(fields[key]));
      }
    });

    // Append profile photo if provided
    if (fileUri) {
      let filename = fileUri.split('/').pop() || 'profile_photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      if (!match) {
        filename = `${filename}.jpg`;
      }
      const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      formData.append('profile_photo', {
        uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
        name: filename,
        type: type,
      });
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST', // use POST with _method override
      headers,
      body: formData,
    });
    return response;
  }
};
