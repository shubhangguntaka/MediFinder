
import React, { useState, useRef } from 'react';
import { CloseIcon, CameraIcon, DocumentScannerIcon, PillIcon, ArrowLeftIcon } from './icons';
import { analyzeMedicineImage } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

interface SmartScanModalProps {
  onClose: () => void;
  onMedicinesFound: (medicines: string[]) => void;
}

const SmartScanModal: React.FC<SmartScanModalProps> = ({ onClose, onMedicinesFound }) => {
  const [step, setStep] = useState<'mode' | 'upload' | 'analyzing'>('mode');
  const [mode, setMode] = useState<'prescription' | 'identification' | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleModeSelect = (selectedMode: 'prescription' | 'identification') => {
    setMode(selectedMode);
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
      if (result && result.medicines.length > 0) {
        onMedicinesFound(result.medicines);
        showToast(`AI found ${result.medicines.length} medicine(s).`, 'success');
        onClose();
      } else {
        showToast("AI couldn't find any medicines. Try a clearer photo.", 'error');
        setStep('upload');
      }
    } catch (error) {
      showToast("Scan failed. Please try again.", 'error');
      setStep('upload');
    }
  };

  const renderModeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center dark:text-white">Smart Visual Search</h3>
      <p className="text-sm text-gray-500 text-center dark:text-gray-400 mb-6">Choose how you want to search using your camera.</p>
      
      <button
        onClick={() => handleModeSelect('prescription')}
        className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group"
      >
        <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-full group-hover:bg-primary-100 transition-colors">
          <DocumentScannerIcon className="w-8 h-8 text-primary-600" />
        </div>
        <div className="text-left">
          <h4 className="font-bold dark:text-white">Scan Prescription</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Extract multiple medicines from a doctor's note.</p>
        </div>
      </button>

      <button
        onClick={() => handleModeSelect('identification')}
        className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all group"
      >
        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-full group-hover:bg-green-100 transition-colors">
          <PillIcon className="w-8 h-8 text-green-600" />
        </div>
        <div className="text-left">
          <h4 className="font-bold dark:text-white">Identify Medicine</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Identify a pill or strip by taking a photo of it.</p>
        </div>
      </button>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-4 text-center">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setStep('mode')} className="text-primary-600 hover:text-primary-700">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold dark:text-white capitalize">{mode} Scan</h3>
      </div>

      <div 
        className={`w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden ${imagePreview ? 'border-primary-500' : 'border-gray-300 dark:border-slate-600'}`}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
        ) : (
          <>
            <CameraIcon className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload or take a photo</p>
          </>
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
          className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-700 dark:text-white rounded-lg font-semibold hover:bg-gray-200"
          disabled={!imagePreview}
        >
          Retake
        </button>
        <button 
          onClick={startAnalysis}
          className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-primary-400"
          disabled={!imagePreview}
        >
          Identify with AI
        </button>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="py-12 text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20"></div>
        <div className="relative bg-white dark:bg-slate-800 rounded-full p-6 shadow-xl border-4 border-primary-100 dark:border-primary-900/50">
          <PillIcon className="w-10 h-10 text-primary-600 animate-bounce" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold dark:text-white">AI is Analyzing...</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Checking medicine database and reading text...</p>
      </div>
      <div className="max-w-[200px] mx-auto space-y-2">
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 w-1/2 animate-[shimmer_2s_infinite_linear]"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-down">
        <div className="p-6">
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          
          {step === 'mode' && renderModeSelection()}
          {step === 'upload' && renderUpload()}
          {step === 'analyzing' && renderAnalyzing()}
        </div>
      </div>
    </div>
  );
};

export default SmartScanModal;
