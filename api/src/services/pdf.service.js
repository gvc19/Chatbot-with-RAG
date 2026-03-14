import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger.js';

export async function extractTextFromPdf(buffer, originalName) {
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();

    if (!text) {
      const error = new Error('The uploaded PDF appears to be empty.');
      error.status = 400;
      error.publicMessage = 'The uploaded PDF has no extractable text.';
      throw error;
    }

    logger.info('Extracted text from PDF', {
      documentName: originalName,
      textLength: text.length
    });

    return text;
  } catch (error) {
    logger.error('Failed to extract text from PDF', {
      error: error.message,
      documentName: originalName
    });
    if (!error.status) {
      error.status = 500;
      error.publicMessage = 'Failed to extract text from the uploaded PDF.';
    }
    throw error;
  }
}

