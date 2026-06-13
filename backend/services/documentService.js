// services/documentService.js
// Handles document upload, storage, parsing, chunking, embedding, and vector DB upsert.

const cloudinary = require('cloudinary').v2;
const pdfParse = require('pdf-parse');
const { Configuration, OpenAIApi } = require('openai'); // placeholder if using OpenAI embeddings fallback
const { getVectorStore } = require('../utils/vectorStore');
const { Readable } = require('stream');

// Configure Cloudinary (replace with your credentials)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary and returns the URL.
 * @param {Buffer} buffer - File buffer.
 * @param {string} originalName - Original filename.
 */
async function uploadToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "auto", public_id: originalName }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Splits text into overlapping chunks.
 * @param {string} text - Full document text.
 * @param {number} chunkSize - Size of each chunk (default 1000 characters).
 * @param {number} overlap - Overlap between chunks (default 200 characters).
 */
function splitIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start += chunkSize - overlap;
  }
  return chunks;
}

/**
 * Generates embeddings for an array of text chunks using Gemini Text Embedding API.
 * @param {string[]} chunks
 */
async function generateEmbeddings(chunks) {
  // Using Gemini embedding endpoint via fetch; replace with your actual endpoint and API key.
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:batchEmbedContents?key=" + apiKey;
  const requestBody = {
    requests: chunks.map((c) => ({
      model: "embedding-001",
      content: { parts: [{ text: c }] },
    })),
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API error: ${err}`);
  }
  const data = await response.json();
  // data.embeddings is an array of objects with embedding values.
  return data.embeddings.map((e) => e.values);
}

/**
 * Main processing function for an uploaded file.
 * @param {Object} file - Multer file object.
 * @param {string} userId - ID of the uploading user.
 */
async function processDocument(file, userId) {
  // 1. Upload to Cloudinary
  const fileUrl = await uploadToCloudinary(file.buffer, file.originalname);

  // 2. Parse PDF (if PDF) or use raw buffer for other types
  let rawText = "";
  if (file.mimetype === "application/pdf") {
    const data = await pdfParse(file.buffer);
    rawText = data.text;
  } else {
    rawText = file.buffer.toString("utf-8");
  }

  // 3. Chunking
  const chunks = splitIntoChunks(rawText);

  // 4. Embedding generation
  const embeddings = await generateEmbeddings(chunks);

  // 5. Upsert into ChromaDB
  const vectorStore = await getVectorStore();
  const documents = chunks.map((content, idx) => ({
    id: `${file.originalname}-${idx}`,
    content,
    metadata: { fileName: file.originalname, userId, url: fileUrl },
  }));
  await vectorStore.addDocuments(documents, embeddings);

  // Return metadata for DB persistence (e.g., Mongo collection)
  return { fileName: file.originalname, url: fileUrl, userId, chunkCount: chunks.length };
}

module.exports = { processDocument };
