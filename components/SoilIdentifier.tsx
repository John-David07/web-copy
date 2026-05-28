'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface SoilData {
  name: string;
  description: string;
  bestFor: string;
  drainage: string;
  nutrients: string;
}

interface SoilIdentifierProps {
  sensorId: string;
}

export function SoilIdentifier({ sensorId }: SoilIdentifierProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved soil data from localStorage on mount (using sensorId)
  useEffect(() => {
    const savedImagePreview = localStorage.getItem(`soil_image_preview_${sensorId}`);
    const savedSoilData = localStorage.getItem(`soil_data_${sensorId}`);
    
    if (savedImagePreview) {
      setImagePreview(savedImagePreview);
    }
    if (savedSoilData) {
      try {
        setSoilData(JSON.parse(savedSoilData));
      } catch (e) {}
    }
  }, [sensorId]);

  const saveToLocalStorage = (preview: string | null, data: SoilData | null) => {
    if (preview) {
      localStorage.setItem(`soil_image_preview_${sensorId}`, preview);
    } else {
      localStorage.removeItem(`soil_image_preview_${sensorId}`);
    }
    
    if (data) {
      localStorage.setItem(`soil_data_${sensorId}`, JSON.stringify(data));
    } else {
      localStorage.removeItem(`soil_data_${sensorId}`);
    }
  };

  const clearSoilData = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSoilData(null);
    setError(null);
    setIsQuotaError(false);
    localStorage.removeItem(`soil_image_preview_${sensorId}`);
    localStorage.removeItem(`soil_data_${sensorId}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      handleFile(file);
    } else {
      setError('Please upload a PNG, JPG, or JPEG file');
      setIsQuotaError(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setSoilData(null);
    setError(null);
    setIsQuotaError(false);
    saveToLocalStorage(previewUrl, null);
    analyzeSoil(file);
  };

  const analyzeSoil = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setIsQuotaError(false);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/soil-identifier', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.soilData) {
        setSoilData(data.soilData);
        saveToLocalStorage(imagePreview, data.soilData);
      } else {
        setError(data.error || 'Failed to identify soil');
        setIsQuotaError(data.isQuotaError || false);
        saveToLocalStorage(imagePreview, null);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setIsQuotaError(false);
    } finally {
      setIsLoading(false);
    }
  };

  const SoilInfoRow = ({ title, content }: { title: string; content?: string }) => {
    if (!content) return null;
    return (
      <div className="py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="font-medium text-gray-700 dark:text-gray-300">{title}:</span>
        <span className="ml-2 text-gray-600 dark:text-gray-400">{content}</span>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        AI Soil Identifier {sensorId && `- ${sensorId.replace('_', ' ')}`}
      </h3>
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-green-400 rounded-lg p-8 text-center cursor-pointer hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 dark:bg-gray-800 dark:text-gray-300 bg-gray-50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isLoading ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">AI is analyzing your soil...</p>
          </div>
        ) : imagePreview && soilData ? (
          <div className="text-left">
            <div className="flex gap-4 mb-4">
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src={imagePreview}
                  alt="Soil preview"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {soilData.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {soilData.description}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <SoilInfoRow title="🌱 Best for" content={soilData.bestFor} />
              <SoilInfoRow title="💧 Drainage" content={soilData.drainage} />
              <SoilInfoRow title="🧪 Nutrients" content={soilData.nutrients} />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-green-600 dark:text-green-400">
                ✅ Soil identified successfully
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Tip: Use this information to choose plants that thrive in {soilData.name.toLowerCase()} soil
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSoilData();
              }}
              className="mt-4 text-sm text-red-600 hover:text-red-700"
            >
              Clear & Upload New
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {imagePreview ? 'Analysis failed. Try again?' : 'Upload a photo of your soil'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              AI will identify soil type and provide care recommendations
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              PNG, JPG, JPEG only
            </p>
            {imagePreview && !soilData && !isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedImage) {
                    analyzeSoil(selectedImage);
                  }
                }}
                className="mt-4 text-sm text-green-600 hover:text-green-700"
              >
                Retry Analysis
              </button>
            )}
          </>
        )}
        
        {error && (
          <div className="mt-4">
            <p className="text-red-600 text-sm">{error}</p>
            {isQuotaError ? (
              <div className="mt-2">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  ⚠️ AI service is currently experiencing high demand
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 Tip: Please try again in a few moments. The soil identifier will work once the service is available.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Tip: Make sure the image clearly shows the soil texture and color for best results.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}