const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extract text from a file based on its extension/mimetype
 * @param {string} filePath - Absolute path to the file
 * @param {string} mimeType - The mime type of the file
 * @returns {Promise<string>} - Extracted text content
 */
async function parseFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.txt' || mimeType === 'text/plain') {
    return await fs.readFile(filePath, 'utf-8');
  } 
  
  if (ext === '.pdf' || mimeType === 'application/pdf') {
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text;
  }
  
  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

module.exports = {
  parseFile
};
