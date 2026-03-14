import express from 'express';
import multer from 'multer';
import { handleUpload } from '../controllers/upload.controller.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

router.post('/', upload.single('file'), handleUpload);

export default router;

