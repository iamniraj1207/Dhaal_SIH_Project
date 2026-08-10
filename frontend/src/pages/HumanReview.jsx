import React, { useState, useRef, useEffect } from 'react';
import './HumanReview.css';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export default function HumanReview({ onComplete, onRestart, hpvData, patientData, imageFile, currentRecordId, aiResult }) {
  const [step, setStep] = useState('review');
  const [note, setNote] = useState('');
  const defaultPriority = hpvData?.hpvDetected ? 'HIGH PRIORITY' : 'ROUTINE';
  const [priority, setPriority] = useState(defaultPriority);
  const [showNoteField, setShowNoteField] = useState(false);
  const qrRef = useRef();
  
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imageFormat, setImageFormat] = useState('JPEG');
  const [filename, setFilename] = useState('');

  useEffect(() => {
    const fn = `Screening_Report_${hpvData?.testId || 'CG'}_${Date.now()}.pdf`;
    setFilename(fn);
  }, [hpvData]);

  useEffect(() => {
    if (imageFile) {
      if (typeof imageFile === 'string') {
        // If it's a path string from demo
        setImageDataUrl(imageFile);
      } else if (imageFile instanceof File) {
        if (imageFile.type === 'image/png') setImageFormat('PNG');
        const reader = new FileReader();
        reader.onload = (e) => setImageDataUrl(e.target.result);
        reader.readAsDataURL(imageFile);
      }
    }
  }, [imageFile]);

  const handleConfirm = () => {
    setStep('complete');
    onComplete(priority, note);
  };

  const handleModifySubmit = (e) => {
    e.preventDefault();
    if (note.trim() === '') return;
    setStep('complete');
    onComplete(priority, note);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Dhaal - Cervical Screening Report", 20, yPos);
    yPos += 15;
    
    // Patient Details
    doc.setFontSize(14);
    doc.text("Patient Demographics", 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Age: ${patientData?.age || 'N/A'}`, 20, yPos);
    doc.text(`Smoking History: ${patientData?.smoking || 'N/A'}`, 80, yPos);
    yPos += 6;
    doc.text(`Hormonal Contraceptives: ${patientData?.hormonalContraceptives ? 'Yes' : 'No'}`, 20, yPos);
    doc.text(`Pregnancies: ${patientData?.pregnancies || 0}`, 80, yPos);
    yPos += 15;

    // Hardware & HPV
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("HPV Rapid Assay Results", 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Test ID: ${hpvData?.testId || 'N/A'}`, 20, yPos);
    doc.text(`Sample Quality: ${hpvData?.testQuality || 'N/A'}`, 80, yPos);
    yPos += 6;
    const hpvStatus = hpvData?.hpvDetected ? "POSITIVE (High-Risk Types Detected)" : "NEGATIVE (Clear)";
    doc.setFont("helvetica", hpvData?.hpvDetected ? "bold" : "normal");
    doc.setTextColor(hpvData?.hpvDetected ? 200 : 0, 0, hpvData?.hpvDetected ? 0 : 0);
    doc.text(`HPV Result: ${hpvStatus}`, 20, yPos);
    doc.setTextColor(0, 0, 0); // reset
    yPos += 15;

    // AI Analysis
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("AI Cytology Analysis", 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const aiPrediction = aiResult?.prediction;
    const isAbnormal = aiPrediction ? ['Koilocytotic', 'Dyskeratotic'].includes(aiPrediction) : hpvData?.hpvDetected;
    const cytologyPattern = aiPrediction ? `${aiPrediction} (${isAbnormal ? 'Abnormal' : 'Normal'})` : (hpvData?.hpvDetected ? "Koilocytotic (Abnormal)" : "Superficial-Intermediate (Normal)");
    const aiConfidence = aiResult?.confidence ? ` (Confidence: ${(aiResult.confidence * 100).toFixed(1)}%)` : "";

    doc.text(`Detected Pattern: ${cytologyPattern}${aiConfidence}`, 20, yPos);
    yPos += 6;
    doc.text(`Final Triage Priority: ${priority}`, 20, yPos);
    yPos += 15;

    // Clinical Notes & Recommendations
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Clinical Notes & Recommendations", 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    
    let recommendation = "";
    if (priority === 'HIGH PRIORITY') {
      recommendation = "RECOMMENDATION: Immediate colposcopy and clinical review strongly advised due to positive high-risk HPV and abnormal cellular features.";
    } else if (priority === 'MODERATE') {
      recommendation = "RECOMMENDATION: Follow-up screening in 6-12 months is recommended to monitor for potential cellular changes.";
    } else {
      recommendation = "RECOMMENDATION: Routine screening interval applies. No immediate further action required.";
    }

    const splitRec = doc.splitTextToSize(recommendation, 170);
    doc.text(splitRec, 20, yPos);
    yPos += (splitRec.length * 6) + 5;

    if (note) {
      doc.text("Clinician Notes:", 20, yPos);
      yPos += 6;
      doc.setFont("helvetica", "italic");
      const splitNotes = doc.splitTextToSize(note, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += (splitNotes.length * 6) + 10;
    }

    // Embed Image if possible
    if (imageDataUrl && yPos < 220) {
      try {
        doc.addImage(imageDataUrl, imageFormat, 20, yPos, 60, 60);
      } catch (e) {
        console.error("Could not add image to PDF", e);
      }
    }

    // Embed QR Code and Save
    const finalizePDF = async () => {
      const saveAndUpload = async () => {
        // 1. Download to local
        doc.save(filename);
        
        // 2. Upload to Supabase Storage
        const pdfBlob = doc.output('blob');
        const { data, error } = await supabase.storage
          .from('reports')
          .upload(filename, pdfBlob, {
            contentType: 'application/pdf',
            upsert: false
          });
          
        if (!error && currentRecordId) {
          const { data: publicUrlData } = supabase.storage.from('reports').getPublicUrl(filename);
          // 3. Update screenings table
          await supabase.from('screenings').update({ report_pdf_url: publicUrlData.publicUrl }).eq('id', currentRecordId);
        }
      };

      if (qrRef.current) {
        const svg = qrRef.current.querySelector('svg');
        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(xml);
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;
        
        const img = new Image();
        img.onload = async function() {
          const canvas = document.createElement('canvas');
          canvas.width = svg.clientWidth || 200;
          canvas.height = svg.clientHeight || 200;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngData = canvas.toDataURL('image/png');
          
          doc.addImage(pngData, 'PNG', 150, 230, 40, 40);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text("Offline Verification", 155, 275);
          await saveAndUpload();
        };
        img.src = image64;
      } else {
        await saveAndUpload();
      }
    };

    finalizePDF();
  };

  const qrData = JSON.stringify({ priority, testId: hpvData?.testId, date: new Date().toISOString() });

  return (
    <div className="review-container">
      {step !== 'complete' && (
        <div className="review-content">
          <div className="review-header">
            <h2>Clinical Review</h2>
            <p>Dhaal's screening recommendation is ready for review.</p>
          </div>

          <Card className="review-card">
            <div className="recommendation-box">
              <span className="recommendation-label">AI Triage Recommendation</span>
              <StatusBadge 
                status={priority === 'HIGH PRIORITY' ? 'danger' : (priority === 'MODERATE' ? 'warning' : 'success')} 
                label={priority} 
                className="large-badge" 
              />
            </div>

            {step === 'review' ? (
              <div className="review-actions">
                <Button variant="accent" onClick={handleConfirm} className="confirm-btn">Confirm</Button>
                <Button variant="secondary" onClick={() => setStep('modify')}>Modify Priority</Button>
                <Button variant="ghost" onClick={() => setShowNoteField(!showNoteField)}>
                  {showNoteField ? 'Cancel Note' : 'Add Clinician Note'}
                </Button>
              </div>
            ) : (
              <form className="modify-form fade-in-scale" onSubmit={handleModifySubmit}>
                <div className="form-group">
                  <label>Override Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className="select-input"
                  >
                    <option value="HIGH PRIORITY">High Priority (Colposcopy/Referral)</option>
                    <option value="MODERATE">Moderate (Follow-up screening)</option>
                    <option value="ROUTINE">Routine (Normal interval)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reason for modification (required)</label>
                  <textarea 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter clinical rationale..."
                    required
                    className="textarea-input"
                  />
                </div>
                <div className="form-actions">
                  <Button variant="ghost" type="button" onClick={() => setStep('review')}>Cancel</Button>
                  <Button variant="accent" type="submit" disabled={!note.trim()}>Save & Complete</Button>
                </div>
              </form>
            )}

            {step === 'review' && showNoteField && (
              <div className="note-field fade-in-scale">
                <label>Clinician Note</label>
                <textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional notes to append to the patient record..."
                  className="textarea-input"
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {step === 'complete' && (
        <div className="complete-content fade-in-scale">
          <div className="complete-header">
            <div className="success-icon pulse-once">✓</div>
            <h2>Screening Complete</h2>
            <ul className="completion-checklist">
              <li>✓ AI analysis completed</li>
              <li>✓ Human review recorded</li>
              <li>✓ Screening document ready</li>
            </ul>
          </div>

          <Card className="document-preview-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="doc-icon">📄</div>
              <div className="doc-info">
                <h4>Screening_Report_{hpvData?.testId || 'CG'}.pdf</h4>
                <p className="mono-light">{new Date().toLocaleDateString()}</p>
                <StatusBadge 
                  status={priority === 'HIGH PRIORITY' ? 'danger' : (priority === 'MODERATE' ? 'warning' : 'success')} 
                  label={priority} 
                />
              </div>
            </div>
            <div ref={qrRef} style={{ background: 'white', padding: '8px', borderRadius: '4px' }}>
              <QRCodeSVG value={qrData} size={80} />
            </div>
          </Card>
          <p className="doc-caption">Ready for printing or referral workflow. Does not constitute a clinical diagnosis.</p>

          <div className="complete-actions">
            <Button variant="primary" onClick={generatePDF}>Download Medical PDF Report</Button>
            <Button variant="accent" onClick={onRestart}>Start New Screening</Button>
          </div>
        </div>
      )}
    </div>
  );
}
