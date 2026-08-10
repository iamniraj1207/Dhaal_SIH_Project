import React, { useState, useRef } from 'react';
import './CytologyUpload.css';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressRail from '../components/ProgressRail';
import StatusBadge from '../components/StatusBadge';

export default function CytologyUpload({ onNext, onCancel }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageQualityWarning, setImageQualityWarning] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    if (selectedFile.size < 50000) { 
      setImageQualityWarning(true);
    } else {
      setImageQualityWarning(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setImageQualityWarning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-container">
      <ProgressRail currentStep={2} />
      
      <div className="upload-content">
        <div className="upload-header">
          <h2>Cytology Scan</h2>
          <p>Upload the patient's Pap smear cytology image for AI analysis.</p>
        </div>

        <Card className="upload-card">
          {!file ? (
            <div 
              className="upload-zone"
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📁</div>
              <p className="upload-text">Drop cytology image here</p>
              <p className="upload-subtext">or <strong>Browse files</strong></p>
              <p className="upload-limits">JPG / PNG &middot; Max 15 MB</p>
              <input 
                type="file" 
                accept="image/jpeg, image/png"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="upload-preview-container fade-in-scale">
              <div className="preview-image-wrapper">
                <img src={previewUrl} alt="Cytology preview" className="preview-image" />
              </div>
              <div className="preview-details">
                <div className="preview-info">
                  <h4>{file.name}</h4>
                  <p className="mono-light">{(file.size / 1024 / 1024).toFixed(2)} MB &middot; Image</p>
                  <StatusBadge status="success" label="Image received" />
                </div>
                <div className="preview-actions">
                  <Button variant="ghost" onClick={removeFile}>Remove</Button>
                  <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>Replace</Button>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              </div>
            </div>
          )}

          {imageQualityWarning && (
            <div className="alert warning-alert">
              <span className="alert-icon">▲</span>
              <p>Image quality may affect AI analysis. Consider uploading a clearer image.</p>
            </div>
          )}
        </Card>

        <div className="form-actions">
          <Button variant="ghost" onClick={onCancel} type="button">Back</Button>
          <Button variant="primary" onClick={() => onNext(file)} disabled={!file}>
            Analyze Screening &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
