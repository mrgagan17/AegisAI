// services/vectorStore.js
// Wrapper around utils/vectorStore to provide higher‑level operations needed by ragService.
// Functions:
//   saveChunks(documentId, userId, chunks, progressCallback) -> stores embeddings and metadata, returns count.
//   searchSimilarity(userId, queryEmbedding, options) -> performs similarity search, filters by userId and optional documentIds.
//   deleteChunks(documentId) -> removes vectors associated with a document.

const { getVectorStore, addDocuments, similaritySearch } = require('../utils/vectorStore');
const geminiService = require('./geminiService'); // for embedding generation

/**
 * Save chunks for a document into the vector store.
 * @param {string} documentId - Mongo Document _id
 * @param {string} userId - Owner user id
 * @param {string[]} chunks - Text chunks to embed
 * @param {function} progressCallback - (percent) => void, called with 0‑100 progress of embedding
 * @returns {Promise<number>} Number of chunks successfully saved
 */
async function saveChunks(documentId, userId, chunks, progressCallback, fileName = '') {
  if (!Array.isArray(chunks) || chunks.length === 0) return 0;
  const vectorStore = await getVectorStore();

  // Generate embeddings in a batch‑wise fashion to avoid overwhelming the API.
  const embeddings = [];
  const batchSize = 20; // reasonable batch size
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    // Generate embedding for each chunk in the batch (Gemini currently only supports single embeddings, so we loop).
    for (const text of batch) {
      // Using geminiService.getEmbedding which returns a 768‑dim vector.
      const emb = await geminiService.getEmbedding(text);
      embeddings.push(emb);
    }
    // Report progress based on processed chunks.
    if (typeof progressCallback === 'function') {
      const pct = Math.round(((i + batch.length) / chunks.length) * 100);
      progressCallback(pct);
    }
  }

  // Prepare documents for vector store.
  const docs = chunks.map((content, idx) => ({
    id: `${documentId}-${idx}`,
    content,
    metadata: { 
      documentId: String(documentId), 
      userId: String(userId),
      fileName: fileName
    }
  }));

  await addDocuments(docs, embeddings);
  return docs.length;
}

/**
 * Search similar vectors.
 * @param {string} userId - Owner user id (used to filter results)
 * @param {number[]} queryEmbedding - Embedding vector for the query
 * @param {object} options - { documentIds?: string[], limit?: number }
 */
async function searchSimilarity(userId, queryEmbedding, { documentIds = [], limit = 5 } = {}) {
  const results = await similaritySearch(queryEmbedding, limit);
  // Filter by userId and optionally by specific documentIds.
  const filtered = results.filter((r) => {
    const meta = r.metadata || {};
    const matchesUser = meta.userId === userId;
    const matchesDoc = documentIds.length === 0 || documentIds.includes(meta.documentId);
    return matchesUser && matchesDoc;
  });
  return filtered;
}

/**
 * Delete all vector chunks belonging to a document.
 * @param {string} documentId - Mongo Document _id
 */
async function deleteChunks(documentId) {
  // Chromadb does not expose a direct delete‑by‑metadata API.
  // As a simple workaround, we retrieve all IDs that start with the documentId prefix and delete them.
  const store = await getVectorStore();
  // Retrieve all ids (may be large); for demo purposes we fetch a large number.
  const all = await store.collection.get({ include: ['metadatas'] }); // assuming collection object is accessible
  const idsToDelete = [];
  if (Array.isArray(all.ids)) {
    all.ids.forEach((id, idx) => {
      const meta = all.metadatas?.[idx];
      if (meta && (meta.documentId === documentId || meta.documentId === String(documentId))) {
        idsToDelete.push(id);
      }
    });
  }
  if (idsToDelete.length > 0) {
    await store.collection.delete({ ids: idsToDelete });
  }
  return idsToDelete.length;
}

module.exports = { saveChunks, searchSimilarity, deleteChunks };
