const fs = require('fs');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Conversation = require('../models/Conversation');
const Chat = require('../models/Chat');
const parsers = require('../utils/parsers');
const vectorStore = require('./vectorStore');
const geminiService = require('./geminiService');
const wsManager = require('./webSocketManager');

/**
 * Split text into chunks with overlap
 * @param {string} text - Raw text content
 * @param {number} chunkSize - Number of characters per chunk
 * @param {number} chunkOverlap - Overlap size
 * @returns {string[]} - Array of text chunks
 */
function splitText(text, chunkSize = 1000, chunkOverlap = 200) {
  if (!text || text.trim() === '') return [];
  const chunks = [];
  let startIndex = 0;

  // Clean double spaces and normalize newlines
  const cleanedText = text.replace(/\r\n/g, '\n').replace(/ +/g, ' ');

  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < cleanedText.length) {
      // Find last space or newline near the boundary to avoid breaking words
      const lastSpace = cleanedText.lastIndexOf(' ', endIndex);
      const lastNewline = cleanedText.lastIndexOf('\n', endIndex);
      
      const boundaryIndex = Math.max(lastSpace, lastNewline);
      
      // If boundary exists and is within current chunk, split there
      if (boundaryIndex > startIndex) {
        endIndex = boundaryIndex;
      }
    }

    const chunk = cleanedText.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Advance start position
    startIndex = endIndex - chunkOverlap;

    // Safety checks to prevent infinite loops
    if (startIndex >= cleanedText.length || chunkOverlap >= chunkSize) {
      break;
    }
  }

  return chunks;
}

/**
 * Extract text, chunk it, embed chunks, and store in vector database asynchronously.
 * Broadcasts progress updates via WebSockets.
 * @param {string} documentId - Document DB ID
 */
async function processDocument(documentId) {
  let doc;
  try {
    doc = await Document.findById(documentId);
    if (!doc) {
      console.error(`Document processing failed: ID ${documentId} not found`);
      return;
    }

    console.log(`Starting processing for document: ${doc.fileName}`);
    doc.processingStatus = 'Processing';
    await doc.save();

    // Broadcast status update
    wsManager.sendToUser(doc.userId, 'DOCUMENT_PROGRESS', {
      documentId: doc._id,
      fileName: doc.fileName,
      status: 'Processing',
      progress: 5
    });

    // 1. Extract Text
    const rawText = await parsers.parseFile(doc.fileUrl, doc.mimeType);
    
    if (!rawText || rawText.trim() === '') {
      throw new Error('No readable text content extracted from document.');
    }

    wsManager.sendToUser(doc.userId, 'DOCUMENT_PROGRESS', {
      documentId: doc._id,
      fileName: doc.fileName,
      status: 'Processing',
      progress: 20
    });

    // 2. Chunk text
    const chunks = splitText(rawText, 1000, 200);
    console.log(`Document split into ${chunks.length} chunks.`);

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document content.');
    }

    // 3. Generate embeddings & save
    const savedChunksCount = await vectorStore.saveChunks(
      doc._id,
      doc.userId,
      chunks,
      (progressPercent) => {
        // Map embedding progress from 20% to 95%
        const overallProgress = Math.round(20 + (progressPercent / 100) * 75);
        wsManager.sendToUser(doc.userId, 'DOCUMENT_PROGRESS', {
          documentId: doc._id,
          fileName: doc.fileName,
          status: 'Processing',
          progress: overallProgress
        });
      },
      doc.fileName
    );

    // 4. Complete Document Status
    doc.processingStatus = 'Completed';
    doc.chunkCount = savedChunksCount;
    await doc.save();

    // Broadcast completion
    wsManager.sendToUser(doc.userId, 'DOCUMENT_PROGRESS', {
      documentId: doc._id,
      fileName: doc.fileName,
      status: 'Completed',
      progress: 100,
      chunkCount: savedChunksCount
    });

    console.log(`Document processing completed: ${doc.fileName}`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error.message);
    if (doc) {
      doc.processingStatus = 'Failed';
      doc.errorMessage = error.message;
      await doc.save();

      wsManager.sendToUser(doc.userId, 'DOCUMENT_PROGRESS', {
        documentId: doc._id,
        fileName: doc.fileName,
        status: 'Failed',
        progress: 0,
        error: error.message
      });
    }
  }
}

/**
 * Handle question answering using RAG flow
 * @param {string} userId - Requesting User ID
 * @param {string} question - Question query string
 * @param {object} options - Options containing conversationId and documentIds
 * @returns {Promise<object>} - Answer, sources, and conversation ID
 */
async function askQuestion(userId, question, options = {}) {
  const { conversationId, documentIds = [] } = options;

  // 1. Get or Create Conversation
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      throw new Error('Conversation not found');
    }
  } else {
    // Create new conversation
    conversation = await Conversation.create({
      userId,
      title: question.length > 30 ? question.substring(0, 30) + '...' : question,
      messages: []
    });
  }

  // 2. Format history (last 8 messages for context window stability)
  const historyLimit = 8;
  const recentMessages = conversation.messages.slice(-historyLimit);
  const formattedHistory = recentMessages.map(msg => ({
    sender: msg.sender,
    text: msg.text
  }));

  // 3. Generate Question Embedding
  const queryEmbedding = await geminiService.getEmbedding(question);

  // 4. Retrieve matching chunks
  // Retrieve top 4 matches
  const matchingChunks = await vectorStore.searchSimilarity(userId, queryEmbedding, {
    documentIds,
    limit: 4
  });

  // Prepare context and source citations
  const contextChunks = matchingChunks.map(chunk => ({
    fileName: chunk.metadata.fileName || 'Unknown File',
    text: chunk.document
  }));

  // Create clean sources object to return
  const sources = matchingChunks.map(chunk => ({
    documentId: chunk.metadata.documentId,
    fileName: chunk.metadata.fileName || 'Unknown File',
    chunkText: chunk.document
  }));

  // 5. Generate Grounded Answer
  const answer = await geminiService.generateAnswer(question, contextChunks, formattedHistory);

  // 6. Save message history to conversation
  conversation.messages.push({
    sender: 'user',
    text: question,
    timestamp: new Date()
  });

  conversation.messages.push({
    sender: 'ai',
    text: answer,
    sources,
    timestamp: new Date()
  });

  await conversation.save();

  // 7. Log to analytical flat Chat model
  await Chat.create({
    userId,
    question,
    answer
  });

  return {
    answer,
    sources,
    conversationId: conversation._id,
    conversationTitle: conversation.title
  };
}

module.exports = {
  processDocument,
  askQuestion,
  splitText
};
