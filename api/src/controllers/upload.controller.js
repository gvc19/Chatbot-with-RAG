import { indexPdf } from '../services/rag.service.js';

export async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('No file uploaded.');
      error.status = 400;
      error.publicMessage = 'Please upload a PDF file.';
      throw error;
    }

    const { originalname, mimetype, buffer } = req.file;

    if (mimetype !== 'application/pdf') {
      const error = new Error('Invalid file type.');
      error.status = 400;
      error.publicMessage = 'Only PDF files are supported.';
      throw error;
    }

    const result = await indexPdf(buffer, originalname);

    res.status(201).json({
      message: 'PDF indexed successfully',
      chunksIndexed: result.chunksIndexed
    });
  } catch (error) {
    next(error);
  }
}

