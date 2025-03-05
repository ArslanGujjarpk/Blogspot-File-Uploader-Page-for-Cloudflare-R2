const express = require('express');
   const multer = require('multer');
   const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
   const cors = require('cors');
   require('dotenv').config();

   const app = express();
   app.use(cors());
   const upload = multer({ storage: multer.memoryStorage() });

   const s3Client = new S3Client({
       region: "auto",
       endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
       credentials: {
           accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
           secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
       },
   });

   app.post('/upload', upload.single('file'), async (req, res) => {
       try {
           const file = req.file;
           if (!file) {
               return res.status(400).json({ error: 'No file uploaded' });
           }

           const uploadParams = {
               Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
               Key: `videos/${Date.now()}_${file.originalname}`,
               Body: file.buffer,
               ContentType: file.mimetype,
           };

           const command = new PutObjectCommand(uploadParams);
           await s3Client.send(command);

           const fileUrl = `https://${process.env.CLOUDFLARE_BUCKET_NAME}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${uploadParams.Key}`;
           res.json({ url: fileUrl });
       } catch (error) {
           console.error('Upload error:', error);
           res.status(500).json({ error: 'Upload failed' });
       }
   });

   module.exports = app;
