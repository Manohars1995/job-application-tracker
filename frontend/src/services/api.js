import axios from "axios";

// ==========================================
// API CONFIGURATION
// ==========================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ==========================================
// GET ALL APPLICATIONS
// ==========================================

export const getApplications = async (params = {}) => {
  const response = await api.get("/applications", {
    params,
  });

  return response.data;
};

// ==========================================
// GET DASHBOARD
// ==========================================

export const getDashboard = async () => {
  const response = await api.get(
    "/applications/dashboard"
  );

  return response.data;
};

// ==========================================
// CREATE APPLICATION
// ==========================================
//
// Supports:
// - Normal application data
// - Multiple job description images
//
// Expected FormData field:
// jobDescriptionImages
//
// Multiple files can be attached.
//

export const createApplication = async (data) => {
  const isFormData = data instanceof FormData;

  const response = await api.post(
    "/applications",
    data,
    {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : {
            "Content-Type": "application/json",
          },
    }
  );

  return response.data;
};

// ==========================================
// UPDATE APPLICATION
// ==========================================
//
// Supports:
// - Normal application data
// - Multiple job description images
//

export const updateApplication = async (
  id,
  data
) => {
  const isFormData = data instanceof FormData;

  const response = await api.put(
    `/applications/${id}`,
    data,
    {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : {
            "Content-Type": "application/json",
          },
    }
  );

  return response.data;
};

// ==========================================
// DELETE APPLICATION
// ==========================================

export const deleteApplication = async (id) => {
  const response = await api.delete(
    `/applications/${id}`
  );

  return response.data;
};

// ==========================================
// GET SETTINGS
// ==========================================

export const getSettings = async () => {
  const response = await api.get("/settings");

  return response.data;
};

// ==========================================
// CREATE SETTING
// ==========================================

export const createSetting = async (data) => {
  const response = await api.post(
    "/settings",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// ==========================================
// EXPORT AXIOS INSTANCE
// ==========================================

export default api;