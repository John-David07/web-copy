'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface PlantData {
  name: string;
  scientificName: string;
  description: string;
  care?: {
    light: string;
    water: string;
    temperature: string;
    humidity: string;
    soil: string;
    fertilizer: string;
    tips: string;
    commonProblems: string;
  };
}

export function PlantIdentifier() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [plantData, setPlantData] = useState<PlantData | null>(null);
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
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setPlantData(null);
    setError(null);
    analyzePlant(file);
  };

  const analyzePlant = async (file: File) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/plant-identify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.plantData) {
        setPlantData(data.plantData);
      } else {
        setError(data.error || 'Failed to identify plant');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const clearPlantData = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setPlantData(null);
    setError(null);
  };

  const CareSection = ({ title, content }: { title: string; content?: string }) => {
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
        🔍 AI Plant Identifier
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">AI is identifying your plant...</p>
          </div>
        ) : imagePreview && plantData ? (
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
                  {plantData.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                  {plantData.scientificName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {plantData.description}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              {plantData.care && (
                <>
                  <CareSection title="☀️ Light" content={plantData.care.light} />
                  <CareSection title="💧 Water" content={plantData.care.water} />
                  <CareSection title="🌡️ Temperature" content={plantData.care.temperature} />
                  <CareSection title="💨 Humidity" content={plantData.care.humidity} />
                  <CareSection title="🌱 Soil" content={plantData.care.soil} />
                  <CareSection title="🧪 Fertilizer" content={plantData.care.fertilizer} />
                  <CareSection title="💡 Pro Tips" content={plantData.care.tips} />
                  <CareSection title="⚠️ Common Problems" content={plantData.care.commonProblems} />
                </>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPlantData();
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
              Upload a photo of a plant
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              AI will identify the plant and provide care recommendations
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
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