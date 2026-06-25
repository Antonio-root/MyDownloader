import React, { useState } from 'react';
import { Download, Search, AlertCircle, Link, Loader2, Video } from 'lucide-react';
import './App.css';

const API_BASE = '/api';
const TOKEN = 'dev-secret-token'; // From backend .env

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  uploader: string;
  duration_string: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState('best');

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    
    try {
      const res = await fetch(`${API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ url })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch info: ${res.status}`);
      }
      
      const data = await res.json();
      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    
    setDownloading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ url, format })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Download failed: ${res.status}`);
      }
      
      // Handle file download
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Default to .mp4
      a.download = `${videoInfo?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
      
    } catch (err: any) {
      setError(err.message || 'Failed to download video');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>MyDownloader</h1>
        <p>Premium Video Downloading Experience</p>
      </header>

      <main className="main-card">
        <form onSubmit={handleFetchInfo} className="input-group">
          <div className="input-wrapper">
            <Link className="url-icon" size={20} />
            <input
              type="url"
              className="url-input"
              placeholder="Paste video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || !url}>
            {loading ? <Loader2 className="spinner" size={20} /> : <Search size={20} />}
            {loading ? 'Extracting Metadata...' : 'Analyze Video'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {videoInfo && (
          <div className="video-info">
            <div className="video-meta">
              <img 
                src={videoInfo.thumbnail} 
                alt={videoInfo.title} 
                className="video-thumbnail"
              />
              <div className="video-details">
                <div>
                  <h3 className="video-title" title={videoInfo.title}>{videoInfo.title}</h3>
                  <div className="video-channel">
                    <Video size={16} />
                    <span>{videoInfo.uploader} • {videoInfo.duration_string}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="download-options">
              <select 
                className="format-select"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                disabled={downloading}
              >
                <option value="best">Best Quality</option>
                <option value="bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best">MP4 Best</option>
                <option value="bestaudio">Audio Only (Best)</option>
              </select>
              <button 
                className="btn-download" 
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="spinner" size={20} /> : <Download size={20} />}
                {downloading ? 'Processing & Downloading...' : 'Download Now'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
