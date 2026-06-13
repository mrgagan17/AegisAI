import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Search, 
  FileCode, 
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // Local upload progress
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const { subscribe } = useSocket();

  // 1. Fetch document list
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // 2. Subscribe to WebSocket progress updates
  useEffect(() => {
    if (!subscribe) return;

    const unsubscribe = subscribe('DOCUMENT_PROGRESS', (data) => {
      console.log('WS progress update received:', data);
      
      setDocuments((prevDocs) => {
        // Find if document already exists
        const exists = prevDocs.some((doc) => doc._id === data.documentId);
        
        if (exists) {
          // Update status & progress
          return prevDocs.map((doc) => {
            if (doc._id === data.documentId) {
              return {
                ...doc,
                processingStatus: data.status,
                progress: data.progress,
                chunkCount: data.chunkCount || doc.chunkCount,
                errorMessage: data.error || ''
              };
            }
            return doc;
          });
        } else {
          // If a new document event is triggered and we don't have it, refetch
          fetchDocuments();
          return prevDocs;
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, fetchDocuments]);

  // 3. File upload handler
  const handleUploadFile = async (file) => {
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit.');
      return;
    }

    // Validate extension
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      setErrorMessage('Only PDF, DOCX, and TXT files are allowed.');
      return;
    }

    setErrorMessage('');
    setUploading(true);
    setUploadProgress(10); // Initial spinner state

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Set local progress up to 90% (the remaining 10% is background processing)
          setUploadProgress(Math.round(percentCompleted * 0.9));
        }
      });

      // Insert the pending document into state
      setDocuments(prev => [response.data.document, ...prev]);
      setUploadProgress(100);
      
      // Clear progress bar after brief timeout
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(null);
      }, 1000);

    } catch (error) {
      console.error('File upload failed:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to upload document. Please try again.');
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // Drag and Drop listeners
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // 4. Delete document handler
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This will remove all its vector embeddings and cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(doc => doc._id !== docId));
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert(error.response?.data?.message || 'Failed to delete document.');
    }
  };

  // Helpers
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="h-6 w-6 text-rose-500" />;
    if (ext === 'docx') return <FileCode className="h-6 w-6 text-blue-500" />;
    return <FileSpreadsheet className="h-6 w-6 text-slate-500" />; // Default txt/others
  };

  // Filtered documents list
  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalCount = documents.length;
  const completedCount = documents.filter(d => d.processingStatus === 'Completed').length;
  const processingCount = documents.filter(d => d.processingStatus === 'Processing' || d.processingStatus === 'Pending').length;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-dark-950 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Documents</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{totalCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
            {totalCount}
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RAG Indexed</p>
            <h3 className="text-3xl font-extrabold text-slate-850 dark:text-white mt-1">{completedCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            {completedCount}
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Processing</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{processingCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            {processingCount}
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Dropzone & List */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* Left Column: File Upload Dropzone */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Ingest New File</h3>

            {/* Drag & Drop Area */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[0.99]'
                  : 'border-slate-200 hover:border-brand-500/50 dark:border-dark-800 dark:hover:border-brand-500/30'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-355">Drag & Drop file here</p>
                  <p className="text-[10px] text-slate-400 mt-1">or click to browse local files</p>
                </div>
                <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                  Supports PDF, DOCX, TXT (Max 10MB)
                </div>
              </label>
            </div>

            {/* Error notifications */}
            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Processing details card */}
            {uploading && (
              <div className="mt-4 p-4 rounded-xl border border-slate-100 bg-slate-50 dark:border-dark-850 dark:bg-dark-900/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
                    Uploading...
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-brand-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Uploaded Documents List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 shadow-sm min-h-[400px]">
            
            {/* List Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Document Collection</h3>
              
              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 dark:text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border pl-9 pr-4 py-2 text-xs bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Document Cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading document indices...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 space-y-4 border-2 border-dashed border-slate-100 dark:border-dark-850 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-900/50 text-slate-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {searchQuery ? 'Try adjusting your search filters.' : 'Upload reference docs to ground your AI customer support assistant.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc._id}
                    className="p-4 rounded-xl border border-slate-200/40 bg-white/40 dark:border-dark-850 dark:bg-dark-900/30 flex items-center justify-between gap-4 hover:border-slate-300/60 dark:hover:border-dark-800/60 transition-all animate-fade-in"
                  >
                    {/* File info details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="shrink-0 p-2 rounded-lg bg-slate-100/70 dark:bg-dark-950/40">
                        {getFileIcon(doc.mimeType, doc.fileName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatBytes(doc.size)}</span>
                          <span>&bull;</span>
                          <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress indicators or Status Actions */}
                    <div className="flex items-center gap-4.5">
                      
                      {/* Status Badges */}
                      {doc.processingStatus === 'Pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                          Pending
                        </span>
                      )}

                      {doc.processingStatus === 'Processing' && (
                        <div className="flex flex-col items-end space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            Indexing ({doc.progress || 0}%)
                          </span>
                          <div className="w-20 bg-slate-200 dark:bg-dark-800 rounded-full h-1 overflow-hidden">
                            <div className="bg-brand-500 h-1 rounded-full" style={{ width: `${doc.progress || 0}%` }}></div>
                          </div>
                        </div>
                      )}

                      {doc.processingStatus === 'Completed' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                          <CheckCircle className="h-3 w-3" />
                          Ready ({doc.chunkCount || 0} vectors)
                        </span>
                      )}

                      {doc.processingStatus === 'Failed' && (
                        <div className="flex items-center gap-1">
                          <span 
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20 cursor-help"
                            title={doc.errorMessage || 'Parsing failed'}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Failed
                          </span>
                        </div>
                      )}

                      {/* Delete Action */}
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        className="p-2 rounded-lg border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:border-transparent transition-all"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
