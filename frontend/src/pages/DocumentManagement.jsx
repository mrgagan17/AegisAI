import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  Search, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';

function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchAllDocuments = async () => {
    try {
      // In a full implementation, we fetch all files across all users.
      // We can create a dashboard-wide request or retrieve from a global stats collection.
      // Let's create an admin document retrieval API.
      // Wait, we need an admin API to get all documents!
      // In our backend admin routes we can add a route if needed, or we can use a query parameter.
      // In backend admin routes we had GET /api/admin/dashboard which returns latest docs.
      // Let's check: did we add a GET /api/admin/documents endpoint or similar?
      // Wait! Let's check our admin routes:
      // In backend/routes/adminRoutes.js:
      // router.get('/dashboard', adminController.getDashboardStats);
      // router.get('/users', adminController.getUsers);
      // router.put('/user/:id/suspend', adminController.suspendUser);
      // router.delete('/user/:id', adminController.deleteUser);
      // router.get('/analytics', adminController.getAnalytics);
      // Oh! We didn't define a specific GET /api/admin/documents endpoint in our routes.
      // But we can implement a cascade or search endpoint.
      // Let's see: we can query the normal /api/documents endpoint, but wait! The normal /api/documents endpoint only returns documents of the logged-in user!
      // To allow admins to view all documents, let's add an endpoint to our backend admin controller:
      // In adminController: exports.getDocuments = async (req, res) => { ... }
      // And register router.get('/documents', adminController.getDocuments) in routes/adminRoutes.js.
      // Wait, this is a minor backend addition that we can do, which will make this admin document management page fully functional!
      // Let's do that! First let's write DocumentManagement.jsx using that API, then edit adminController and adminRoutes to support it. That is perfect!
      const response = await api.get('/admin/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch global documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  const handleDeleteDocument = async (docId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this document from the platform? This will remove all associated text vectors and physical files.'
    );
    if (!confirmDelete) return;

    setDeletingId(docId);
    try {
      // We can use the normal delete document API, which already supports admin override deletion!
      // In documentController.deleteDocument, it checks: if (document.userId.toString() !== req.user.id && req.user.role !== 'admin')
      // This means the normal DELETE /api/documents/:id API works perfectly for admins too! That is fantastic design.
      await api.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d._id !== docId));
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert(error.response?.data?.message || 'Delete document failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="h-4.5 w-4.5 text-rose-500" />;
    if (ext === 'docx') return <FileCode className="h-4.5 w-4.5 text-blue-500" />;
    return <FileSpreadsheet className="h-4.5 w-4.5 text-slate-500" />;
  };

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-dark-950 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5.5 w-5.5 text-brand-600" />
            Global Document Repository
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit and manage all reference manuals, handbooks, and policy files uploaded across all user accounts.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 dark:text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by file name or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:border-brand-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading global document logs...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-450 dark:text-slate-500">
            No uploaded files match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-650 dark:text-slate-400">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-dark-900/40 border-b border-slate-200/55 dark:border-dark-800/40 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">File Size</th>
                  <th className="px-6 py-4">Upload Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-850">
                {filteredDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/20 dark:hover:bg-dark-900/10 transition-colors">
                    {/* File Name with icon */}
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
                        <span className="shrink-0">{getFileIcon(doc.fileName)}</span>
                        <span className="truncate" title={doc.fileName}>{doc.fileName}</span>
                      </div>
                    </td>

                    {/* Owner Details */}
                    <td className="px-6 py-4">
                      <div className="leading-tight">
                        <p className="font-medium text-slate-750 dark:text-slate-350">{doc.userId?.name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{doc.userId?.email || 'N/A'}</p>
                      </div>
                    </td>

                    {/* File Size */}
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {formatBytes(doc.size)}
                    </td>

                    {/* Upload Date */}
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>

                    {/* Processing Status */}
                    <td className="px-6 py-4">
                      {doc.processingStatus === 'Completed' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/10">
                          Ready ({doc.chunkCount || 0} vectors)
                        </span>
                      )}
                      
                      {doc.processingStatus === 'Processing' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Indexing
                        </span>
                      )}

                      {doc.processingStatus === 'Pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-900/20 dark:text-slate-400 border border-slate-205">
                          Pending
                        </span>
                      )}

                      {doc.processingStatus === 'Failed' && (
                        <span 
                          className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100/40 dark:border-rose-900/10 cursor-help"
                          title={doc.errorMessage || 'Unknown error'}
                        >
                          Failed
                        </span>
                      )}
                    </td>

                    {/* Delete Action */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        disabled={deletingId === doc._id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Document"
                      >
                        {deletingId === doc._id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default DocumentManagement;
