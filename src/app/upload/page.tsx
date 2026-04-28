"use client";

import { useState, useRef } from "react";

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      setUrl(null);
      setCopied(false);
    }
  };

  const handleUpload = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", fileRef.current.files[0]);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUrl(data.url);
      }
    } catch {
      setUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const copyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(baseUrl + url);
      setCopied(true);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fafafa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: 20,
    }}>
      <div style={{
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 16,
        padding: 40,
        maxWidth: 480,
        width: "100%",
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          📸 Subir Captura
        </h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
          Sube una imagen y obtendrás un enlace para compartir en el chat
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed #444",
            borderRadius: 12,
            padding: preview ? 0 : "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          {preview ? (
            <img src={preview} alt="Preview" style={{ width: "100%", borderRadius: 10 }} />
          ) : (
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
              <div style={{ color: "#aaa" }}>Haz clic para seleccionar una imagen</div>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        {preview && !url && (
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#666" : "#facc15",
              color: "#000",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: 16,
            }}
          >
            {loading ? "Subiendo..." : "Subir y obtener enlace"}
          </button>
        )}

        {url && (
          <div style={{
            background: "#0a0a0a",
            border: "1px solid #22c55e",
            borderRadius: 10,
            padding: 16,
          }}>
            <div style={{ fontSize: 14, color: "#22c55e", fontWeight: 600, marginBottom: 8 }}>
              ✅ Enlace copiado al portapapeles
            </div>
            <div
              style={{
                background: "#111",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 12,
                color: "#aaa",
                wordBreak: "break-all",
                marginBottom: 10,
              }}
            >
              {baseUrl}{url}
            </div>
            <button
              onClick={copyUrl}
              style={{
                width: "100%",
                padding: 10,
                background: copied ? "#22c55e" : "#333",
                color: copied ? "#000" : "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copied ? "✅ Copiado" : "Copiar enlace"}
            </button>
            <p style={{ fontSize: 12, color: "#666", marginTop: 10, textAlign: "center" }}>
              Pega este enlace en el chat para que lo vea el asistente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
