import { useState } from 'react';
import FileDropzone from '../../components/ui/FileDropzone';
import { parseCSV, validateCSVHeaders } from '../../utils/csvValidator';
import { usePageTitle } from '../../hooks/usePageTitle';
import useUpload from '../../hooks/useUpload';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useToast } from '../../components/common/Toast';

function PreviewTable({ headers, rows }) {
  return (
    <div className="mt-4 overflow-auto rounded-lg border border-white/5 bg-white/2">
      <table className="min-w-full divide-y divide-white/5">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs text-slate-300">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="odd:bg-white/1">
              {headers.map((h) => (
                <td key={h} className="whitespace-nowrap px-3 py-2 text-sm text-slate-200">
                  {r[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UploadPage() {
  usePageTitle('Upload');
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [errors, setErrors] = useState([]);
  const { loading, error: uploadError, success: uploadSuccess, upload, reset } = useUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const toast = useToast();

  const handleFileLoad = async (payload, err) => {
    setErrors([]);
    reset();
    setCsvData({ headers: [], rows: [] });
    setSelectedFile(null);
    if (err) {
      setErrors([err.message || 'File error']);
      return;
    }

    if (!payload) return;

    const { file, text } = payload;
    setSelectedFile(file);

    // parse and preview first 5 rows
    const parsed = parseCSV(text, 5);
    setCsvData(parsed);

    // validation
    const missing = validateCSVHeaders(parsed.headers);
    if (missing.length > 0) {
      setErrors(missing.map((m) => `Missing column: ${m}`));
    }
  };

  // demo: mock CSV if user wants quick demo
  const loadMock = async () => {
    const mock = `date,product,quantity,revenue\n2026-07-01,Widget A,10,250.00\n2026-07-02,Widget B,5,120.00\n2026-07-03,Widget A,8,200.00\n2026-07-04,Widget C,2,40.00\n2026-07-05,Widget B,7,168.00`;
    const parsed = parseCSV(mock, 5);
    setCsvData(parsed);
    const missing = validateCSVHeaders(parsed.headers);
    setErrors(missing.map((m) => `Missing column: ${m}`));
    if (missing.length === 0) {
      toast.show('CSV validation passed (mock)', 'info');
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-white">Sales Data Upload</h1>
        <p className="mt-2 text-sm text-slate-400">Upload CSV files containing sales records.</p>

        <section className="mt-6 space-y-4">
          <FileDropzone onFileLoad={handleFileLoad} />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadMock}
              className="rounded-lg bg-cyan-600/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-600/20"
            >
              Load mock CSV
            </button>

            <button
              type="button"
              onClick={async () => {
                setErrors([]);
                if (!selectedFile) {
                  setErrors(['No file selected for upload']);
                  return;
                }

                // simple client-side check before upload
                const missing = validateCSVHeaders(csvData.headers);
                if (missing.length > 0) {
                  setErrors(missing.map((m) => `Missing column: ${m}`));
                  return;
                }

                const res = await upload(selectedFile);
                if (res?.success) {
                  // reset UI
                  setSelectedFile(null);
                  setCsvData({ headers: [], rows: [] });
                  try {
                    toast.show(res?.message || `${res.rowsProcessed || 0} rows uploaded`, 'info');
                  } catch (e) {}
                } else if (res?.errors && res.errors.length > 0) {
                  setErrors(res.errors.map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e))));
                } else if (res?.message) {
                  setErrors([res.message]);
                }
              }}
              disabled={loading}
              className="ml-2 rounded-lg bg-emerald-600/10 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {errors.length > 0 && <ErrorMessage messages={errors} title="Validation errors" />}

          {uploadError && <ErrorMessage messages={[uploadError]} title="Upload error" />}

          {uploadSuccess && (
            <div className="mt-4">
              <div className="rounded-md bg-emerald-900/5 p-3 text-sm text-emerald-300">{uploadSuccess}</div>
            </div>
          )}

          {csvData.rows.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm text-slate-300">Preview (first {csvData.rows.length} rows)</h3>
              <PreviewTable headers={csvData.headers} rows={csvData.rows} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
