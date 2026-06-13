/**
 * RAG Pipeline Local Diagnostic Test Script
 * Run with: npm run test:rag
 */
const { splitText } = require('../services/ragService');
const geminiService = require('../services/geminiService');
const vectorStore = require('../services/vectorStore');

async function runTest() {
  console.log('--- STARTING RAG DIAGNOSTIC TEST ---');
  
  // 1. Text Chunking test
  const sampleDoc = `
Welcome to the AI Customer Support Agent Platform employee handbook.
This company was founded in 2026.
Our primary office hours are Monday through Friday, 9:00 AM to 5:00 PM.
Employees are eligible for 15 days of paid vacation leave per calendar year.
To apply for leave, submit a request through the HR portal at least 2 weeks in advance.
The health insurance plan covers 80% of dental and vision expenses up to a maximum of $1500 per year.
  `.trim();

  console.log('\n[Step 1] Testing Text Splitter...');
  const chunks = splitText(sampleDoc, 150, 30);
  console.log(`Generated ${chunks.length} chunks:`);
  chunks.forEach((c, idx) => console.log(`  Chunk ${idx + 1}: "${c.replace(/\n/g, ' ')}" (${c.length} chars)`));

  // 2. Embedding generation test
  console.log('\n[Step 2] Testing Embedding Vector Generation...');
  try {
    const textToEmbed = 'primary office hours are Monday through Friday';
    console.log(`Generating embedding for: "${textToEmbed}"`);
    const vector = await geminiService.getEmbedding(textToEmbed);
    console.log(`Success! Vector length: ${vector.length} dimensions.`);
    console.log(`First 5 components: [${vector.slice(0, 5).join(', ')}]`);
  } catch (error) {
    console.error('Embedding generation failed:', error.message);
  }

  // 3. Question Answering test
  console.log('\n[Step 3] Testing Question Grounding Prompt Generator...');
  try {
    const question = 'How many days of vacation leave do I get?';
    const mockContext = [
      { fileName: 'handbook.txt', text: 'Employees are eligible for 15 days of paid vacation leave per calendar year.' },
      { fileName: 'handbook.txt', text: 'To apply for leave, submit a request through the HR portal at least 2 weeks in advance.' }
    ];
    console.log(`User Question: "${question}"`);
    console.log('Generating answer using Gemini...');
    const answer = await geminiService.generateAnswer(question, mockContext);
    console.log('\n================ GEMINI ANSWER ================');
    console.log(answer);
    console.log('===============================================\n');
  } catch (error) {
    console.error('QA Generation failed:', error.message);
  }

  console.log('--- RAG DIAGNOSTIC TEST COMPLETED ---');
  process.exit(0);
}

runTest();
