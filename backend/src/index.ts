import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import YTDlpWrapModule from 'yt-dlp-wrap';
const YTDlpWrap = (YTDlpWrapModule as any).default || YTDlpWrapModule;
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Path to save downloads temporarily (if needed later)
const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

let ytDlpWrap: any;

// Initialize yt-dlp binary
// This will download the yt-dlp executable for your OS if it isn't already present
const initYtDlp = async () => {
    try {
        console.log('Checking for yt-dlp binary...');
        await YTDlpWrap.downloadFromGithub();
        console.log('yt-dlp binary is ready!');
        ytDlpWrap = new YTDlpWrap();
    } catch (err: any) {
        console.warn('Failed to download yt-dlp from GitHub:', err.message);
        console.log('Attempting to use system yt-dlp binary...');
        ytDlpWrap = new YTDlpWrap();
    }
};

initYtDlp();

app.use(cors());
app.use(express.json());

// Simple Auth Middleware
// For now we use a simple Bearer token from .env
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.API_TOKEN || 'dev-secret-token';
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ytDlpReady: !!ytDlpWrap });
});

// Endpoint to fetch video metadata
app.post('/api/info', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    if (!ytDlpWrap) {
      res.status(503).json({ error: 'yt-dlp is not ready yet' });
      return;
    }

    console.log(`Fetching info for: ${url}`);
    const videoInfo = await ytDlpWrap.getVideoInfo(url);
    res.json(videoInfo);
  } catch (error: any) {
    console.error('Error fetching info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to download the video
app.post('/api/download', requireAuth, async (req, res) => {
  try {
    const { url, format = 'best' } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    if (!ytDlpWrap) {
      res.status(503).json({ error: 'yt-dlp is not ready yet' });
      return;
    }

    console.log(`Starting download for: ${url} with format: ${format}`);
    
    // We can pipe the download directly to the response
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    res.setHeader('Content-Type', 'video/mp4');

    const ytDlpEventEmitter = ytDlpWrap.exec([
      url,
      '-f', format,
      '-o', '-' // Output to stdout
    ]);

    ytDlpEventEmitter.ytDlpProcess?.stdout?.pipe(res);

    ytDlpEventEmitter.on('error', (error: any) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    });

  } catch (error: any) {
    console.error('Error starting download:', error);
    if (!res.headersSent) {
        res.status(500).json({ error: error.message });
    }
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
