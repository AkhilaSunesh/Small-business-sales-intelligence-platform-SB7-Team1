import PropTypes from 'prop-types';
import { useCallback, useRef, useState } from 'react';

function bytesToSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export default function FileDropzone({ onFileLoad }) {
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Only .csv files are accepted');
        setFileInfo(null);
        onFileLoad(null, new Error('Invalid file type'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setFileInfo({ name: file.name, size: file.size });
        setError('');
        onFileLoad({ file, text });
      };
      reader.onerror = () => {
        setError('Failed to read file');
        onFileLoad(null, new Error('Read failed'));
      };
      reader.readAsText(file);
    },
    [onFileLoad],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      handleFile(f);
    },
    [handleFile],
  );

  const onBrowse = useCallback(() => inputRef.current?.click(), []);

  const onChange = useCallback(
    (e) => {
      const f = e.target.files?.[0];
      handleFile(f);
    },
    [handleFile],
  );

  const remove = useCallback(() => {
    setFileInfo(null);
    setError('');
    onFileLoad(null);
    if (inputRef.current) inputRef.current.value = null;
  }, [onFileLoad]);

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={onBrowse}
        className="relative cursor-pointer rounded-2xl border-2 border-dashed border-white/10 bg-slate-950/80 p-6 text-center hover:border-cyan-300/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={onChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-lg font-medium text-white">Drag & drop CSV here</div>
          <div className="text-sm text-slate-400">or click to browse</div>
          <div className="mt-3 text-xs text-slate-400">Only .csv files accepted</div>
        </div>
      </div>

      {fileInfo ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/5 bg-white/3 p-3">
          <div>
            <p className="text-sm font-medium text-white">{fileInfo.name}</p>
            <p className="text-xs text-slate-400">{bytesToSize(fileInfo.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={remove}
              className="rounded-md bg-rose-600/10 px-3 py-2 text-xs text-rose-300 hover:bg-rose-600/20"
            >
              Remove file
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}

FileDropzone.propTypes = {
  onFileLoad: PropTypes.func.isRequired,
};
