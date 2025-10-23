import express from "express";
import cors from "cors";
import request from "request";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);

app.use("/api", (req, res) => {
  let targetUrl;

  // req.url di sini TIDAK lagi mengandung /api.
  // Contoh: /web/session/authenticate ATAU /contacts
  
  // --- PERBAIKAN DI SINI ---
  // Jika ini adalah rute otentikasi Odoo, JANGAN tambahkan /api
  if (req.url.startsWith("/web/session/authenticate")) {
    targetUrl = `http://localhost:8069${req.url}`;
    console.log("Proxying Auth (non-api) to:", targetUrl);
  } else {
    // Untuk rute API kustom Anda (seperti /contacts), tambahkan /api
    targetUrl = `http://localhost:8069/api${req.url}`;
    console.log("Proxying API request to:", targetUrl);
  }

  const options = {
    url: targetUrl,
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      // Penting: Teruskan juga cookie sesi jika ada
      "Cookie": req.headers.cookie,
    },
    body: JSON.stringify(req.body),
  };

  // Pipe respons kembali ke klien
  request(options).pipe(res);
});

app.listen(3000, () => {
  console.log("✅ Proxy running on http://localhost:3000");
});

