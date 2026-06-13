// utils/vectorStore.js
// Wrapper around ChromaDB (self-hosted) for storing and retrieving document embeddings.

const { ChromaClient } = require('chromadb'); // npm install chromadb

let client = null;
let collection = null;

/**
 * Initialize the ChromaDB client and collection.
 * Reads environment variables VECTOR_DB (must be 'chroma') and CHROMA_COLLECTION.
 */
async function init() {
  if (client && collection) return { client, collection };
  const vectorDb = process.env.VECTOR_DB || 'chroma';
  if (vectorDb !== 'chroma') {
    throw new Error(`Vector DB ${vectorDb} not supported by this wrapper yet.`);
  }
  const chromaHost = process.env.CHROMA_HOST || 'localhost';
  const chromaPort = parseInt(process.env.CHROMA_PORT || '8000', 10);
  client = new ChromaClient({ host: chromaHost, port: chromaPort });
  const collectionName = process.env.CHROMA_COLLECTION || 'documents';
  collection = await client.getOrCreateCollection({ name: collectionName, embeddingFunction: null });
  return { client, collection };
}

/**
 * Add documents with pre‑computed embeddings.
 * @param {Array} docs - Array of objects { id, content, metadata }
 * @param {Array<Array<number>>} embeddings - Parallel array of embedding vectors.
 */
async function addDocuments(docs, embeddings) {
  const { collection } = await init();
  const ids = docs.map(d => d.id);
  const metadatas = docs.map(d => d.metadata);
  const documents = docs.map(d => d.content);
  await collection.add({ ids, embeddings, metadatas, documents });
  return true;
}

/**
 * Perform a similarity search.
 * @param {Array<number>} queryEmbedding - Embedding vector for the query.
 * @param {number} topK - Number of results to return.
 * @returns {Array} Array of result objects { id, document, metadata, distance }
 */
async function similaritySearch(queryEmbedding, topK = 5) {
  const { collection } = await init();
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances'],
  });
  const formatted = results.ids[0].map((id, idx) => ({
    id,
    document: results.documents[0][idx],
    metadata: results.metadatas[0][idx],
    distance: results.distances[0][idx],
  }));
  return formatted;
}

module.exports = { getVectorStore: init, addDocuments, similaritySearch };
