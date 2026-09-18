import { useState, useRef } from 'react';
import api from '../services/api';
import type { ImportResult } from '../types';
import {
  PageHeader,
  Button,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import { useEffect } from 'react';
import {
  FileUp,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';

const IMPORT_TYPES = [
  { value: 'sales', label: 'Sales Data', description: 'Import sales records from XLSX, CSV, or JSON files' },
  { value: 'purchases', label: 'Purchase Data', description: 'Import purchase records from XLSX, CSV, or JSON files' },
  { value: 'expenses', label: 'Expense Data', description: 'Import expense records from XLSX, CSV, or JSON files' },
  { value: 'customers', label: 'Customers', description: 'Import customer records from XLSX, CSV, or JSON files' },
  { value: 'suppliers', label: 'Suppliers', description: 'Import supplier records from XLSX, CSV, or JSON files' },
  { value: 'products', label: 'Products', description: 'Import product catalog from XLSX, CSV, or JSON files' },
];

export default function DataImport() {
  useEffect(() => {
    updateBreadcrumbs([{ label: 'Data Import' }]);
  }, []);

  const [selectedType, setSelectedType] = useState('sales');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const importResult = await api.importData(file, selectedType);
      setResult(importResult);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed. Please check the file format and try again.';
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Data Import"
        description="Import business data from XLSX, CSV, or JSON files"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Type Selection */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Import Type</h3>
          <div className="space-y-2">
            {IMPORT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => { setSelectedType(type.value); setResult(null); setError(null); }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedType === type.value
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm font-medium ${selectedType === type.value ? 'text-primary-700' : 'text-gray-900'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Upload File</h3>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors"
          >
            <FileUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your file here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: XLSX, CSV, JSON
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected File */}
          {file && (
            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          )}

          {/* Import Button */}
          <div className="mt-4">
            <Button
              onClick={handleImport}
              disabled={!file}
              loading={importing}
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold text-gray-900">Import Complete</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Rows</p>
                  <p className="text-lg font-bold text-gray-900">{result.totalRows}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600">Imported</p>
                  <p className="text-lg font-bold text-green-700">{result.imported}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600">Duplicates</p>
                  <p className="text-lg font-bold text-amber-700">{result.duplicates}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600">Invalid</p>
                  <p className="text-lg font-bold text-red-700">{result.invalid}</p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <p className="text-xs text-primary-600">Quality Score</p>
                  <p className="text-lg font-bold text-primary-700">{result.qualityScore}%</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                  <ul className="space-y-1">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        {err}
                      </li>
                    ))}
                    {result.errors.length > 10 && (
                      <li className="text-xs text-gray-500">...and {result.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
