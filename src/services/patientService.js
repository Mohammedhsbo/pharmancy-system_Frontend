import api from './api';

const PATIENTS_PREFIX = '/patients';

export const patientService = {
  // Patients
  getPatients: async (params = {}) => {
    const response = await api.get(`${PATIENTS_PREFIX}/patients`, { params });
    return response;
  },

  getPatientById: async (id) => {
    const response = await api.get(`${PATIENTS_PREFIX}/patients/${id}`);
    return response;
  },

  createPatient: async (data) => {
    const response = await api.post(`${PATIENTS_PREFIX}/patients`, data);
    return response;
  },

  updatePatient: async (id, data) => {
    const response = await api.patch(`${PATIENTS_PREFIX}/patients/${id}`, data);
    return response;
  },

  deletePatient: async (id) => {
    const response = await api.delete(`${PATIENTS_PREFIX}/patients/${id}`);
    return response;
  },

  getPatientHistory: async (id) => {
    const response = await api.get(`${PATIENTS_PREFIX}/patients/${id}/history`);
    return response;
  },

  // Prescriptions
  getPrescriptions: async (params = {}) => {
    const response = await api.get(`${PATIENTS_PREFIX}/prescriptions`, { params });
    return response;
  },

  getPrescriptionById: async (id) => {
    const response = await api.get(`${PATIENTS_PREFIX}/prescriptions/${id}`);
    return response;
  },

  createPrescription: async (data) => {
    const response = await api.post(`${PATIENTS_PREFIX}/prescriptions`, data);
    return response;
  },

  updatePrescription: async (id, data) => {
    const response = await api.patch(`${PATIENTS_PREFIX}/prescriptions/${id}`, data);
    return response;
  },

  dispensePrescription: async (id, data = {}) => {
    const response = await api.patch(`${PATIENTS_PREFIX}/prescriptions/${id}/dispense`, data);
    return response;
  },
};
