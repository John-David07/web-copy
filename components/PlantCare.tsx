'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface CareData {
  name: string;
  scientificName: string;
  watering: string;
  sunlight: string;
  temperature: string;
  humidity: string;
  soil: string;
  commonIssues: string;
}

export function PlantCare() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [careData, setCareData] = useState<CareData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImagePreview(URL.createObjectURL(file));
    setCareData(null);
    setError(null);
    analyzePlant(file);
  };

  const analyzePlant = async (file: File) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/plant-care', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.careData) {
        setCareData(data.careData);
      } else {
        setError(data.error || 'Failed to analyze plant');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const CareSection = ({ title, content }: { title: string; content?: string }) => {
    if (!content) return null;
    return (
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h4>
        <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{content}</p>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        AI Plant Care Assistant
      </h3>
      
      {/* Upload Area */}
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">AI is analyzing your plant...</p>
          </div>
        ) : imagePreview && careData ? (
          <div className="text-left">
            <div className="flex gap-4 mb-4">
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src={imagePreview}
                  alt="Plant preview"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {careData.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {careData.scientificName}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <CareSection title="💧 Watering" content={careData.watering} />
              <CareSection title="☀️ Sunlight" content={careData.sunlight} />
              <CareSection title="🌡️ Temperature" content={careData.temperature} />
              <CareSection title="💨 Humidity" content={careData.humidity} />
              <CareSection title="🌱 Soil" content={careData.soil} />
              <CareSection title="⚠️ Common Issues" content={careData.commonIssues} />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
                setImagePreview(null);
                setCareData(null);
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
              Click or drag & drop an image
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              PNG, JPG, JPEG only
            </p>
          </>
        )}
        
        {error && (
          <p className="mt-4 text-red-600 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}