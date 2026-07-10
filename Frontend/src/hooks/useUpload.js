import { useCallback, useState } from 'react';
import { uploadSalesFile } from '../services/uploadService';

export default function useUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const upload = useCallback(async (file) => {
    setError(null);
    setSuccess(null);
    if (!file) {
      setError('No file selected');
      return null;
    }

    setLoading(true);
    try {
      const res = await uploadSalesFile(file);
      if (res?.success) {
        setSuccess(res?.message || `${res.rowsProcessed || 0} rows uploaded successfully`);
      } else {
        const msg = res?.message || 'Upload completed with issues';
        setError(msg);
      }
      return res;
    } catch (err) {
      const details = err?.details || [];
      const msg = err?.message || 'Upload failed, please try again';
      setError(msg);
      return { success: false, message: msg, errors: details };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(null);
    setLoading(false);
  }, []);

  return { loading, error, success, upload, reset };
}
