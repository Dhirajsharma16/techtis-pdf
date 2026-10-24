# TECHTIS | Serverless, $0-Cost PDF Utility Platform
> Domain: **techtis.in** | Architecture: **100% Client-Side Engine + Cloudflare Edge AI & D1 Database**

**TECHTIS** is an ultra-fast, responsive, serverless **iLovePDF alternative** featuring a complete suite of **32 PDF and AI utilities**. It runs with **zero server costs ($0/month)**, zero file retention, and sub-100ms processing speed.

---

## 🎯 The $0 Architecture Blueprint

| Layer | Technology | Cost / Month | Quota / Limits | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Domain & CDN** | Cloudflare Pages (`techtis.in`) | **$0.00** | Unlimited bandwidth | Global Anycast Edge CDN + Auto SSL |
| **PDF Operations** | `pdf-lib.js` + `PDF.js` | **$0.00** | Unlimited (Browser RAM) | Merge, split, rotate, watermark, sign, compress |
| **Office & Parsing** | `JSZip` + XML DOM Parsers | **$0.00** | Unlimited (Browser RAM) | Word (DOCX) & Excel (XLSX) to PDF |
| **OCR Scan-to-Text** | `Tesseract.js` (WASM) | **$0.00** | Unlimited (Browser RAM) | 100% Client-side OCR without any API keys |
| **Edge AI Intelligence**| **Cloudflare Workers AI** | **$0.00** | **10,000 Neurons / Day** | Meta Llama 3.1 8B, Llama 3.2 3B, M2M100 translation |
| **Edge SQL Database** | **Cloudflare D1** | **$0.00** | **5,000,000 reads / day**<br>**100,000 writes / day** | Serverless SQLite for telemetry & anonymous sync |
| **Fallback AI API** | Groq Cloud / Gemini Free | **$0.00** | 14,400 req/day (Groq) | High-speed backup for LLM inference |

---

## ☁️ How to Use Cloudflare Free AI & D1 Database Efficiently

Cloudflare provides the most generous free developer tier in the cloud industry today. Here is how TECHTIS utilizes it without incurring a single penny:

### 1. Cloudflare Workers AI (10,000 Free Neurons / Day)
- **Zero API Key Requirement:** Unlike OpenAI or Gemini, Cloudflare Workers AI runs models directly on Cloudflare GPU edge nodes inside your Worker. You don't need any external API keys or paid accounts!
- **Models Used in TECHTIS:**
  - `@cf/meta/llama-3.1-8b-instruct`: State-of-the-art document summarization and form blank detection.
  - `@cf/meta/m2m100-1.2b`: Multilingual machine translation across 100+ languages.
- **Cost Efficiency Strategy:**
  - Standard short summaries cost between **20 to 50 Neurons per execution**.
  - 10,000 free daily Neurons gives you **200 to 500 complete AI document summaries or translations every single day for $0**.
  - If your site surpasses the daily 10,000 neuron limit, TECHTIS automatically falls back to our **in-browser TextRank RAM engine** (0 tokens used, infinite scale).

### 2. Cloudflare D1 (Free Serverless Relational Database)
- **What is D1?** D1 is Cloudflare's serverless SQLite database with automated edge replication.
- **Free Tier Limits:**
  - **5,000,000 read rows per day**
  - **100,000 write rows per day**
  - **5 GB of storage space**
- **How TECHTIS Uses D1:**
  1. `telemetry` table: Records anonymous metrics (tool ID, processing time in ms, bytes compressed) to compute site-wide bandwidth saved without storing ANY user data.
  2. `feedback` table: Collects 1-click bug reports and user feedback.
  3. `synced_logs` table: Allows users to sync their privacy history across their phone and laptop using a short anonymous pairing code (no account or login required).
  4. **Strict Zero-Byte Rule:** We never store actual PDF files in D1. User documents remain exclusively in browser memory.

---

## 🚀 Step-by-Step Deployment Guide for `techtis.in`

### Step 1: Deploy Static Frontend to Cloudflare Pages ($0)
1. Fork or push this repository to GitHub.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Select your repository:
   - **Framework preset:** `None`
   - **Build command:** (leave blank)
   - **Build output directory:** `.` (root directory)
5. Click **Save and Deploy**.
6. Once deployed, go to the project's **Custom Domains** tab:
   - Click **Set up a custom domain**.
   - Enter `techtis.in` (and `www.techtis.in`).
   - Cloudflare will automatically provision a free SSL certificate!

---

### Step 2: Deploy Cloudflare Worker with Workers AI and D1

1. Open your terminal in the `cloudflare-worker` directory:
   ```bash
   cd cloudflare-worker
   ```

2. Authenticate Wrangler with your Cloudflare account (if you haven't already):
   ```bash
   npx wrangler login
   ```

3. Create your free D1 database:
   ```bash
   npx wrangler d1 create techtis-pdf-db
   ```
   *Wrangler will output a `database_id` (e.g. `c7484d8b-1234-4567-89ab-cdef01234567`).*

4. Open `wrangler.toml` and update the `database_id`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "techtis-pdf-db"
   database_id = "PASTE_YOUR_DATABASE_ID_HERE"
   ```

5. Initialize the database schema:
   ```bash
   npx wrangler d1 execute techtis-pdf-db --file=./schema.sql
   ```

6. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
   *Wrangler will output your live edge URL: `https://techtis-edge.<your-subdomain>.workers.dev`.*

7. In the TECHTIS platform (on `techtis.in`), click **Edge AI Settings** in the top navigation bar and paste your worker URL.

---

## 💻 Local Testing & Development

Run TECHTIS locally without installing Node.js or Python:

### Windows:
- Double-click **`start-server.bat`**, or
- Run PowerShell:
  ```powershell
  .\server.ps1
  ```
- Open `http://localhost:8080` in your web browser.

---

## 🛠️ Complete Suite of 32 Tools

### 1. Organize & Manage
- **Merge PDF**: Combine multiple PDFs with custom ordering.
- **Split PDF**: Split by page ranges or extract all pages into a ZIP.
- **Rotate PDF**: Rotate any page 90°, 180°, or 270°.
- **Remove Pages**: Visually select and delete pages.
- **Extract Pages**: Pull specific pages into a new document.
- **Organize Pages**: Visual grid drag-and-drop reordering.
- **Crop PDF**: Trim visual margins and media boxes.

### 2. Security & Compliance
- **Unlock PDF**: Strip owner security restrictions.
- **Protect PDF**: Client-side AES password encryption.
- **Sign PDF**: HTML5 signature drawing and stamp engine.
- **Flatten PDF**: Permanently bake form inputs and vector annotations.
- **Metadata Editor**: View and modify document author, title, and keywords.

### 3. Convert to PDF
- **JPG/PNG to PDF**: Convert photos into unified documents.
- **Word (DOCX) to PDF**: In-browser XML document compiler.
- **Excel (XLSX) to PDF**: In-browser spreadsheet table generator.
- **Text to PDF**: Format plain text and code snippets into PDF.
- **Markdown to PDF**: GitHub Flavored Markdown renderer.
- **Scan to PDF**: Live camera scanner with perspective and contrast filters.

### 4. Convert from PDF
- **PDF to JPG**: Hi-DPI 2x canvas rendering with individual or ZIP export.
- **OCR PDF (Scan to Text)**: Client-side WASM OCR via Tesseract.js.
- **Extract Text**: High-speed text extraction stream.

### 5. AI & Edge Intelligence
- **AI Document Summarizer**: Bullet-point insights via Cloudflare Workers AI (Llama 3.1 8B).
- **AI Document Translator**: 100-language translation via M2M100.
- **Form Blank Detector**: Structural scan for uncompleted fields and signature lines.
- **Document Compare**: Side-by-side text difference highlighting.

### 6. Optimize & Repair
- **Compress PDF**: Object stream deduplication and font compaction.
- **Grayscale PDF**: Ink-saver black and white conversion.
- **Repair PDF**: XRef table rebuilder for corrupted byte offsets.
- **Form Filler**: Interactive PDF AcroForm filler.
