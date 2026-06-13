const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const ragService = require('../services/ragService');
const vectorStore = require('../services/vectorStore');

/**
 * @desc    Upload and process a document
 * @route   POST /api/documents/upload
 * @access  Private
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { originalname, filename, size, mimetype, path: filePath } = req.file;

    // Create Document record in database
    const document = await Document.create({
      userId: req.user.id,
      fileName: originalname,
      fileUrl: filePath, // Stored locally on disk
      fileKey: filename,
      size,
      mimeType: mimetype,
      processingStatus: 'Pending'
    });

    // Run processing asynchronously so request returns immediately
    // The client will listen to status updates via WebSockets
    ragService.processDocument(document._id);

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully. Processing started in background.',
      document
    });
  } catch (error) {
    console.error('File upload controller error:', error);
    return res.status(500).json({ success: false, message: 'Server error during file upload' });
  }
};

/**
 * @desc    Get user's uploaded documents
 * @route   GET /api/documents
 * @access  Private
 */
exports.getDocuments = async (req, res) => {
  try {
    // Admins can see all files if they query with global search, but let's restrict to user files here
    // And handle admin viewing all files in the admin controller
    const documents = await Document.find({ userId: req.user.id }).sort({ uploadDate: -1 });
    return res.json({ success: true, count: documents.length, documents });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete document and its text vectors
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Check ownership (only file owner or admin can delete)
    if (document.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
    }

    // 1. Delete matching vector chunks
    await vectorStore.deleteChunks(document._id);

    // 2. Delete physical file from uploads folder
    if (fs.existsSync(document.fileUrl)) {
      try {
        fs.unlinkSync(document.fileUrl);
      } catch (fileErr) {
        console.error(`Error deleting physical file: ${document.fileUrl}`, fileErr.message);
      }
    }

    // 3. Delete document from database
    await document.deleteOne();

    return res.json({ success: true, message: 'Document and associated vectors deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
