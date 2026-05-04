"use client";

import { useEffect, useState } from "react";

import {
  Download,
  LinkIcon,
  Moon,
  Sun,
  Music2,
  Video,
  Loader2,
  Sparkles,
  Home,
  Trash2,
  Clock3,
  History,
} from "lucide-react";

type Format = {
  quality: string;
  ext: string;
  size: string;
  best?: boolean;
  url: string;
  type?: string;
};

type QueueItem = {
  id: number;
  title: string;
  thumbnail: string;
  progress: number;
  speed: string;
  eta: string;
  mediaType?: string;
  ext?: string;
  duration?: string;
  status: "downloading" | "completed";
};

export default function HomePage() {
  const [theme, setTheme] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("home");

  const [url, setUrl] = useState("");

  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"video" | "audio">("video");

  const [videoData, setVideoData] = useState<any>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);

  const [completed, setCompleted] = useState<QueueItem[]>([]);

  const [toast, setToast] = useState({
    show: false,

    message: "",

    type: "success",
  });

  useEffect(() => {
    setTheme("dark");

    const saved = localStorage.getItem("completed-downloads");

    if (saved) {
      setCompleted(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (theme) {
      document.body.className = theme;
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("completed-downloads", JSON.stringify(completed));
  }, [completed]);

  if (!theme) return null;

  // =========================
  // SHOW TOAST
  // =========================

  const showToast = (
    message: string,

    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({
      show: true,

      message,

      type,
    });

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }));
    }, 3500);
  };

  // =========================
  // FETCH MEDIA
  // =========================

  const handleFetch = async () => {
    if (!url) return;

    try {
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/extract`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          url,
        }),
      });

      const data = await response.json();

      if (data.error) {
        showToast(
          data.message,

          "warning",
        );

        return;
      }

      const filteredFormats = data.formats.filter((f: any) =>
        mode === "video" ? f.type === "video" : f.type === "audio",
      );

      setVideoData({
        ...data,

        formats: filteredFormats,

        duration: data.duration
          ? `${Math.floor(data.duration / 60)}:${String(
              data.duration % 60,
            ).padStart(2, "0")}`
          : "00:00",
      });
    } catch (error) {
      console.log(error);

      showToast(
        "Download failed.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DOWNLOAD
  // =========================

  const handleDownload = async (item: Format) => {
    const id = Date.now();

    const queueItem: QueueItem = {
      id,

      title: videoData.title,

      thumbnail: videoData.thumbnail,

      progress: 0,

      speed: "0 MB/s",

      eta: "Preparing...",

      status: "downloading",

      mediaType: item.type && item.type !== "" ? item.type : "video",

      ext:
        item.ext && item.ext !== ""
          ? item.ext.toUpperCase()
          : item.type === "audio"
            ? "MP3"
            : "MP4",

      duration:
        videoData?.duration && videoData.duration !== ""
          ? videoData.duration
          : "00:00",
    };

    setQueue((prev) => [queueItem, ...prev]);

    setActiveTab("history");

    try {
      let progress = 0;

      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 12);

        if (progress >= 95) {
          progress = 95;

          clearInterval(interval);
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  progress,
                  speed: `${(Math.random() * 5 + 1).toFixed(2)} MB/s`,
                  eta: `${Math.floor(Math.random() * 20)}s`,
                }
              : q,
          ),
        );
      }, 500);

      // =========================
      // PROFESSIONAL BACKEND DOWNLOAD
      // =========================

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/merge-download`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            url,

            quality: item.quality,
          }),
        },
      );

      // =========================
      // HANDLE ERRORS
      // =========================

      if (!response.ok) {
        showToast(
          "Failed to process this media.",

          "error",
        );
        return;
      }

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = blobUrl;

      a.download = `${videoData.title}.${item.ext}`;

      document.body.appendChild(a);

      a.click();
      
      showToast(

        "Download started successfully.",

        "success"
      );

      a.remove();

      window.URL.revokeObjectURL(blobUrl);

      setTimeout(() => {
        clearInterval(interval);

        setQueue((prev) => prev.filter((q) => q.id !== id));

        const completedItem = {
          ...queueItem,

          progress: 100,

          status: "completed" as const,
        };

        setCompleted((prev) => [completedItem, ...prev]);
      }, 5000);
    } catch (error) {
      console.log(error);

      showToast(
        "Failed to process this media.",

        "error",
      );
    }
  };

  // =========================
  // REMOVE HISTORY
  // =========================

  const removeCompleted = (id: number) => {
    setCompleted((prev) => prev.filter((item) => item.id !== id));
  };

  // =========================
  // CLEAR HISTORY
  // =========================

  const clearAllHistory = () => {
    setCompleted([]);

    localStorage.removeItem("completed-downloads");
  };

  return (
    <main className="main">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
      <div className="bg-glow glow-1"></div>
      <div className="bg-glow glow-2"></div>

      <div className="container">
        {/* TOPBAR */}

        <div className="topbar">
          <div className="brand">
            <div className="logo">
              <Download size={26} />
            </div>

            <div>
              <h1>TB Loader</h1>
              <p>Ultra Fast Downloader</p>
            </div>
          </div>

          <button
            className="theme-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* NAVIGATION */}

        <div className="nav-tabs">
          <button
            className={activeTab === "home" ? "nav-btn active-nav" : "nav-btn"}
            onClick={() => setActiveTab("home")}
          >
            <Home size={18} />
            Home
          </button>

          <button
            className={
              activeTab === "history" ? "nav-btn active-nav" : "nav-btn"
            }
            onClick={() => setActiveTab("history")}
          >
            <History size={18} />
            History
          </button>
        </div>

        {/* HOME */}

        {activeTab === "home" && (
          <>
            <div className="hero">
              <div className="hero-badge">
                <Sparkles size={15} />
                Premium Downloader Experience
              </div>

              <h2>Download Video & Audio Instantly</h2>

              <p>Ξ Fast • Premium • Real-time Ξ</p>
            </div>

            <div className="author-credit">
              ✠ Crafted by <span>♔MΔSH乂ΞØBLIVIØN</span>
            </div>

            {/* INPUT CARD */}

            <div className="card">
              <div className="tabs">
                <button
                  className={mode === "video" ? "tab active-tab" : "tab"}
                  onClick={() => setMode("video")}
                >
                  <Video size={18} />
                  Video
                </button>

                <button
                  className={mode === "audio" ? "tab active-tab" : "tab"}
                  onClick={() => setMode("audio")}
                >
                  <Music2 size={18} />
                  Audio
                </button>
              </div>

              <div className="input-box">
                <LinkIcon size={18} />

                <input
                  type="text"
                  placeholder="Paste YouTube / TikTok / Facebook URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <button
                className="fetch-btn"
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Fetch Media
                  </>
                )}
              </button>
            </div>

            {/* PREVIEW */}

            {videoData && (
              <>
                <div className="preview-card">
                  <img src={videoData.thumbnail} alt="thumbnail" />

                  <div className="preview-content">
                    <div className="preview-top">
                      <span className="badge">
                        {mode === "video" ? "VIDEO" : "AUDIO"}
                      </span>

                      <span className="duration">
                        <Clock3 size={14} />
                        {videoData.duration}
                      </span>
                    </div>

                    <h3>{videoData.title}</h3>
                  </div>
                </div>

                {/* QUALITY */}

                <div className="quality-grid">
                  {videoData.formats.map((item: Format, index: number) => (
                    <div className="quality-card" key={index}>
                      <div className="quality-left">
                        <div className="quality-icon">
                          {item.ext === "mp3" ? (
                            <Music2 size={22} />
                          ) : (
                            <Video size={22} />
                          )}
                        </div>

                        <div>
                          <h4>
                            {item.quality}

                            {item.best && <span className="best">BEST</span>}
                          </h4>

                          <p>
                            {item.ext.toUpperCase()} • {item.size}
                          </p>
                        </div>
                      </div>

                      <button
                        className="download-btn"
                        onClick={() => handleDownload(item)}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* HISTORY */}

        {activeTab === "history" && (
          <div className="queue-section">
            <div className="history-header">
              <h3 className="history-title">Download History</h3>

              {completed.length > 0 && (
                <button className="clear-btn" onClick={clearAllHistory}>
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>

            {/* ACTIVE DOWNLOADS */}

            {queue.length > 0 && (
              <>
                {queue.map((item) => (
                  <div className="queue-card" key={item.id}>
                    <img src={item.thumbnail} alt="thumb" />

                    <div className="queue-content">
                      <div className="media-header">
                        <div
                          className={
                            item.mediaType === "audio"
                              ? "media-badge audio-badge"
                              : "media-badge video-badge"
                          }
                        >
                          {item.mediaType === "audio" ? (
                            <>
                              <Music2 size={13} />
                              AUDIO
                            </>
                          ) : (
                            <>
                              <Video size={13} />
                              VIDEO
                            </>
                          )}
                        </div>

                        <div className="media-ext">
                          {item.ext?.toUpperCase()}
                        </div>

                        <div className="media-duration">
                          <Clock3 size={13} />
                          {item.duration}
                        </div>
                      </div>

                      <h4>{item.title}</h4>

                      <div className="queue-progress">
                        <div
                          className="queue-fill"
                          style={{
                            width: `${item.progress}%`,
                          }}
                        ></div>
                      </div>

                      <div className="queue-bottom">
                        <span>{item.progress}%</span>

                        <span>{item.speed}</span>

                        <span>ETA {item.eta}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* COMPLETED */}

            {completed.length === 0 && queue.length === 0 ? (
              <div className="empty-box">No history found</div>
            ) : (
              completed.map((item) => (
                <div className="queue-card" key={item.id}>
                  <img src={item.thumbnail} alt="thumb" />

                  <div className="queue-content">
                    <div className="media-header">
                      <div
                        className={
                          item.mediaType === "audio"
                            ? "media-badge audio-badge"
                            : "media-badge video-badge"
                        }
                      >
                        {item.mediaType === "audio" ? (
                          <>
                            <Music2 size={13} />
                            AUDIO
                          </>
                        ) : (
                          <>
                            <Video size={13} />
                            VIDEO
                          </>
                        )}
                      </div>

                      <div className="media-ext">{item.ext?.toUpperCase()}</div>

                      <div className="media-duration">
                        <Clock3 size={13} />
                        {item.duration}
                      </div>
                    </div>

                    <h4>{item.title}</h4>

                    <p>Download completed</p>
                  </div>

                  <button
                    className="delete-btn"
                    onClick={() => removeCompleted(item.id)}
                  >
                    <Trash2 size={20} strokeWidth={2.4} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
