import api from './api';

export async function uploadSalesFile(file) {
  if (!file) throw new Error('No file provided');

  const form = new FormData();
  form.append('file', file);

  try {
    const res = await api.post('/api/sales/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    // Format error
    const message = err?.response?.data?.message || err.message || 'Upload failed';
    const details = err?.response?.data?.errors || [];
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

export default { uploadSalesFile };
