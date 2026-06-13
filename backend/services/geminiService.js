const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey.trim() !== '') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini API successfully initialized.');
  } catch (error) {
    console.error('Error initializing Gemini API:', error.message);
  }
} else {
  console.warn('\n======================================================');
  console.warn('WARNING: GEMINI_API_KEY is not set in backend/.env.');
  console.warn('The application will use MOCK AI and Mock Embeddings.');
  console.warn('All features will still work, but replies will be mocked.');
  console.warn('======================================================\n');
}

/**
 * Generate a vector embedding for a given text
 * @param {string} text - The text content to embed
 * @returns {Promise<number[]>} - 768-dimension vector array
 */
async function getEmbedding(text) {
  if (!genAI) {
    // Generate a mock embedding vector (768 numbers)
    // Simply hash or map words to some values, or return a standardized normalized pseudo-random vector
    const size = 768;
    const mockEmbedding = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    for (let i = 0; i < size; i++) {
      const seed = Math.sin(hash + i) * 10000;
      mockEmbedding.push(seed - Math.floor(seed));
    }
    // Normalize vector
    const magnitude = Math.sqrt(mockEmbedding.reduce((sum, val) => sum + val * val, 0));
    return mockEmbedding.map(val => val / (magnitude || 1));
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: 768
    });
    return result.embedding.values;
  } catch (error) {
    console.error('Gemini Embedding Error:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Answer a question using the retrieved context from uploaded files
 * @param {string} question - User question
 * @param {Array<{fileName: string, text: string}>} contextChunks - Retrieved text pieces
 * @param {Array<{sender: string, text: string}>} history - Conversation history
 * @returns {Promise<string>} - The grounded answer from Gemini
 */
async function generateAnswer(question, contextChunks, history = []) {
  // Format context for prompt
  let contextText = '';
  if (contextChunks.length > 0) {
    contextText = contextChunks.map((chunk, index) => {
      return `[Source ${index + 1}: ${chunk.fileName}]\n${chunk.text}\n`;
    }).join('\n');
  } else {
    contextText = 'No document context available.';
  }

  // System Prompt for RAG Grounding
  const systemPrompt = `You are an AI customer support assistant. Answer the user's question only using the provided context from uploaded documents.
If the answer is not present in the documents, respond exactly: 'I could not find that information in the uploaded documents.'
Never make up or hallucinate information. If you use information from a specific source, cite it (e.g. [Source 1], [Source 2]).`;

  // Format history messages
  let historyPrompt = '';
  if (history && history.length > 0) {
    historyPrompt = 'Conversational History:\n' + history.map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n') + '\n\n';
  }

  const prompt = `
${systemPrompt}

${historyPrompt}
Retrieved Document Context:
=========================================
${contextText}
=========================================

User Question: ${question}

Grounded Answer:`;

  if (!genAI) {
    // Return a mock grounded response showing what was retrieved
    if (contextChunks.length === 0) {
      return `I could not find that information in the uploaded documents. (Mock AI: No files uploaded yet)`;
    }
    
    // Simulate finding matching text
    const matchingChunk = contextChunks[0];
    return `[Mock AI Response] Based on the document "${matchingChunk.fileName}":

Here is a snippet from your documents: "${matchingChunk.text.substring(0, 150)}..."

(Note: To get real AI responses, please configure your GEMINI_API_KEY in backend/.env)`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini Generation Error:', error.message);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

module.exports = {
  getEmbedding,
  generateAnswer
};
