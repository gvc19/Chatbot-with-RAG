import React, { useState } from 'react';
import api from '../api/api.js';

const PdfUploader = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] ?? null);
    setStatus('');
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    setStatus('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setStatus('PDF uploaded and indexed successfully.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="uploader-container">
      <div className="uploader-controls">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>
      {status && <div className="uploader-status">{status}</div>}
    </div>
  );
};

export default PdfUploader;

