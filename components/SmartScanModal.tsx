
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, CameraIcon, DocumentScannerIcon, PillIcon, ArrowLeftIcon, ShieldExclamationIcon } from './icons';
import { analyzeMedicineImage } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

interface SmartScanModalProps {
  onClose: () => void;
  onMedicinesFound: (medicines: string[]) => void;
}

const ANALYZING_MESSAGES = [
  "Enhancing image quality...",
  "Scanning pharmaceutical database...",
  "Recognizing pill imprints and packaging...",
  "Extracting prescription text...",
  "Cross-referencing global drug names...",
  "Almost there, finalizing results..."
];

const SmartScanModal: React.FC<SmartScanModalProps> = ({ onClose, onMedicinesFound }) => {
  const [step, setStep] = useState<'mode' | 'upload' | 'analyzing'>('mode');
  const [mode, setMode] = useState<'prescription' | 'identification' | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzingMessageIdx, setAnalyzingMessageIdx] = useState(0);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let interval: number;
    if (step === 'analyzing') {
      interval = window.setInterval(() => {
        setAnalyzingMessageIdx((prev) => (prev + 1) % ANALYZING_MESSAGES.length);
      }, 2500);
    }
    return () => window.clearInterval(interval);
  }, [step]);

  const handleModeSelect = async (selectedMode: 'prescription' | 'identification') => {
    setMode(selectedMode);
    
    // Check for camera permission if possible
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
    } catch (err) {
      console.warn("Camera permission denied", err);
      setPermissionState('denied');
    }
    
    setStep('upload');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!imagePreview || !mode) return;

    setStep('analyzing');
    const base64Data = imagePreview.split(',')[1];
    const mimeType = imagePreview.split(';')[0].split(':')[1];

    try {
      const result = await analyzeMedicineImage(base64Data, mimeType, mode);
      if (result?.error) {
        showToast(result.error, 'error');
        setStep('upload');
        return;
      }
      if (result && result.medicines.length > 0) {
        onMedicinesFound(result.medicines);
        showToast(`AI successfully found ${result.medicines.length} medicine(s).`, 'success');
        onClose();
      } else {
        showToast(result?.note || "AI couldn't find any medicines. Please ensure the label is clearly visible.", 'error');
        setStep('upload');
      }
    } catch (error) {
      showToast("Scan failed due to a connection issue. Please try again.", 'error');
      setStep('upload');
    }
  };

  const renderModeSelection = () => (
    <div className="space-y-4 animate-fade-in-down">
      <h3 className="text-2xl font-bold text-center dark:text-white">Smart Visual Search</h3>
      <p className="text-sm text-gray-500 text-center dark:text-gray-400 mb-6">Choose an AI-powered scanning mode to find your medicines faster.</p>
      
      <div className="grid gap-3">
        <button
          onClick={() => handleModeSelect('prescription')}
          className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group shadow-sm hover:shadow-md"
        >
          <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-xl group-hover:bg-primary-100 transition-colors">
            <DocumentScannerIcon className="w-8 h-8 text-primary-600" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-lg dark:text-white">Scan Prescription</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Extracts multiple medicine names from hand-written or printed notes.</p>
          </div>
        </button>

        <button
          onClick={() => handleModeSelect('identification')}
          className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group shadow-sm hover:shadow-md"
        >
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl group-hover:bg-green-100 transition-colors">
            <PillIcon className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-lg dark:text-white">Identify Medicine</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Take a photo of a loose pill or a medicine strip to identify it.</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-6 text-center animate-fade-in-down">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setStep('mode')} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold dark:text-white capitalize">{mode === 'prescription' ? 'Prescription' : 'Medicine'} Scan</h3>
      </div>

      {permissionState === 'denied' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700/50 flex items-start gap-3 text-left">
          <ShieldExclamationIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Camera Permission Required</p>
            <p className="text-xs text-amber-800 dark:text-amber-300">You've denied camera access. You can still upload a photo from your gallery using the area below.</p>
          </div>
        </div>
      )}

      <div 
        className={`w-full aspect-[4/3] border-3 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300 ${imagePreview ? 'border-primary-500 ring-4 ring-primary-500/10' : 'border-gray-200 dark:border-slate-600 hover:border-primary-300'}`}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <div className="text-gray-400 flex flex-col items-center gap-4">
            <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-full shadow-inner">
              <CameraIcon className="w-16 h-16" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold dark:text-gray-200">Snap a Photo</p>
              <p className="text-sm text-gray-500">Tap here to open camera or browse gallery</p>
            </div>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => setImagePreview(null)}
          className="flex-1 py-4 px-6 bg-gray-100 dark:bg-slate-700 dark:text-white rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          disabled={!imagePreview}
        >
          Retake
        </button>
        <button 
          onClick={startAnalysis}
          className="flex-1 py-4 px-6 bg-primary-600 text-white rounded-2xl font-bold shadow-lg hover:bg-primary-700 hover:shadow-primary-500/20 transition-all disabled:bg-primary-300"
          disabled={!imagePreview}
        >
          Start AI Analysis
        </button>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="py-16 text-center space-y-10 animate-fade-in-down">
      <div className="relative w-32 h-32 mx-auto">
        <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-10"></div>
        <div className="absolute inset-[-8px] border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className="relative bg-white dark:bg-slate-800 rounded-full p-8 shadow-2xl border-4 border-primary-50 dark:border-primary-900/30 flex items-center justify-center">
          <DocumentScannerIcon className="w-12 h-12 text-primary-600 animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-extrabold dark:text-white tracking-tight">AI is working...</h3>
        <p className="text-base text-primary-600 font-medium animate-pulse h-6">{ANALYZING_MESSAGES[analyzingMessageIdx]}</p>
      </div>
      
      <div className="max-w-[280px] mx-auto">
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-primary-600 w-full animate-[shimmer_2s_infinite_linear]"></div>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 leading-relaxed uppercase tracking-widest font-bold">Processing modality: VISION-3.0</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-down border border-white/10">
        <div className="p-8 sm:p-10">
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all">
              <CloseIcon className="w-7 h-7" />
            </button>
          </div>
          
          <div className="min-h-[400px] flex flex-col justify-center">
            {step === 'mode' && renderModeSelection()}
            {step === 'upload' && renderUpload()}
            {step === 'analyzing' && renderAnalyzing()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartScanModal;
