'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, Loader2 } from 'lucide-react';
import { importExcelData } from '@/app/actions';
import { autoCategorize } from '@/lib/autoCategorize';

export default function UploadExcel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const json = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: ""
      });

      // Map to expected format (ignoring case of column headers)
      const mappedData = json.map((row: any) => {
        const getVal = (keyStr: string) => {
          const key = Object.keys(row).find(k => k.toLowerCase().includes(keyStr));
          return key ? row[key] : '';
        };
        
        const itemName = getVal('name') || getVal('item');
        let category = getVal('category') || getVal('type');
        
        if (itemName && !category) {
          category = autoCategorize(String(itemName));
        }

        return {
          name: itemName,
          category: category,
          quantity: parseInt(getVal('quantity') || getVal('qty') || '0', 10)
        };
      }).filter(r => r.name && r.category); // Filter invalid rows

      if (mappedData.length > 0) {
        await importExcelData(mappedData);
        alert(`Successfully imported ${mappedData.length} items!`);
      } else {
        alert("No valid data found. Ensure your sheet has 'Name', 'Category', and 'Quantity' columns.");
      }
    } catch (error) {
      console.error(error);
      alert('Error parsing Excel file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
        {isUploading ? (
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        ) : (
          <UploadCloud className="w-12 h-12 text-gray-400" />
        )}
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isUploading ? 'Importing data...' : 'Click or drag Excel/CSV file here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ensure columns are named: Name, Category, Quantity
          </p>
        </div>
      </div>
    </div>
  );
}
