import React, { useState, useRef, useCallback } from 'react';
import { apiFetch } from '../context/AuthContext';

interface VideoUploaderProps {
  onUploaded: (key: string) => void;
  accept?: string;
}

export function VideoUploader({ onUploaded, accept = 'video/mp4,video/webm,video/ogg' }: VideoUploaderProps) {
  const [dragging,  setDragging ] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress ] = useState(0);
  const [uploaded,  setUploaded ] = useState<string | null>(null);
  const [error,     setError    ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!file) return;

    const maxMB = 500;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`Файл занадто великий. Максимум ${maxMB}MB`);
      return;
    }

    setUploading(true); setProgress(0); setError('');

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');

    try {
      const key = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            resolve(res.key);
          } else {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || 'Помилка завантаження'));
          }
        };

        xhr.onerror = () => reject(new Error('Мережева помилка'));

        xhr.open('POST', `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/upload/video`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      setUploaded(file.name);
      onUploaded(key);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true);  }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#4f46e5' : '#e5e7eb'}`,
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragging ? '#ede9fe' : '#fafafa',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={onFileChange}
        />

        {uploaded && !uploading ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ fontWeight: 600, color: '#059669' }}>Завантажено!</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{uploaded}</p>
            <button
              onClick={e => { e.stopPropagation(); setUploaded(null); setProgress(0); }}
              style={{ marginTop: 12, padding: '6px 16px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}
            >
              Замінити відео
            </button>
          </div>
        ) : uploading ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <p style={{ fontWeight: 600 }}>Завантаження... {progress}%</p>
            <div style={{ margin: '12px auto 0', maxWidth: 240, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#4f46e5', borderRadius: 4, transition: 'width 0.3s' }}/>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
            <p style={{ fontWeight: 600, color: '#374151' }}>Перетягни відео або клікни</p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>MP4, WebM, OGG · до 500MB</p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, color: '#dc2626', fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
