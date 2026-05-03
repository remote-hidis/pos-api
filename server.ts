import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import PDFDocument from "pdfkit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GENERIC PROXY HANDLER (Handling users, sales, products, categories, etc.)
  app.use("/api/proxy", async (req, res) => {
    // 1. Dapatkan Target URL (Gunakan header atau fallback ke default)
    const targetBaseUrl = (req.headers['x-target-base-url'] as string) || "https://pos-api.nganjuk.net/api";
    // Ambil token dari header atau query string (untuk window.open)
    const queryToken = req.query.token as string;
    const authHeader = req.headers['authorization'] || (queryToken ? `Bearer ${queryToken}` : undefined);
    
    // In app.use, req.url is relative to /api/proxy
    const apiPath = req.url.split('?')[0]; // Hilangkan query params untuk pengecekan path
    const cleanBaseUrl = targetBaseUrl.endsWith('/') ? targetBaseUrl.slice(0, -1) : targetBaseUrl;
    const finalUrl = `${cleanBaseUrl}${req.url}`; // Gunakan req.url asli untuk forward query params ke backend jika perlu

    console.log(`[Proxy] ${req.method} ${apiPath} -> ${finalUrl}`);

    try {
      const options: RequestInit = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || ''
        }
      };

      // 3. Forward body untuk request yang membutuhkan data
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(finalUrl, options);
      console.log(`[Proxy] Status: ${response.status} ${response.statusText}`);
      
      // Khusus untuk endpoint print, jika user minta PDF (atau default untuk path ini)
      if (apiPath.startsWith('/sales/print/') && response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          // Ukuran kertas thermal 58mm (kurang lebih 164pt lebar)
          const doc = new PDFDocument({ 
            size: [164, 400], 
            margin: 10,
            bufferPages: true 
          }); 
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename=receipt-${data.transaction_info?.id || 'id'}.pdf`);
          
          doc.pipe(res);
          
          // Header Toko
          doc.fontSize(10).font('Helvetica-Bold').text(data.store_name.toUpperCase(), { align: 'center' });
          doc.fontSize(6).font('Helvetica').text(data.store_address, { align: 'center' });
          
          doc.moveDown(0.5);
          doc.fontSize(6).text('='.repeat(45), { align: 'center' });
          doc.moveDown(0.5);

          // Info Transaksi
          doc.fontSize(6);
          const tinfo = data.transaction_info;
          const dateStr = tinfo.created_at ? new Date(tinfo.created_at).toLocaleString('id-ID', {
            dateStyle: 'short',
            timeStyle: 'short'
          }) : '-';
          
          doc.font('Helvetica-Bold').text('NO TRX  : ', { continued: true }).font('Helvetica').text(`#TRX-${tinfo.id}`);
          doc.font('Helvetica-Bold').text('TANGGAL : ', { continued: true }).font('Helvetica').text(dateStr);
          doc.font('Helvetica-Bold').text('KASIR   : ', { continued: true }).font('Helvetica').text(tinfo.cashier_name || 'Admin');
          doc.font('Helvetica-Bold').text('METODE  : ', { continued: true }).font('Helvetica').text(tinfo.payment_method);
          
          doc.moveDown(0.5);
          doc.fontSize(6).text('-'.repeat(45), { align: 'center' });
          doc.moveDown(0.5);

          // Items Header
          doc.font('Helvetica-Bold');
          doc.text('ITEM', 10, doc.y, { width: 80, continued: true });
          doc.text('QTY', 100, doc.y, { width: 20, align: 'center', continued: true });
          doc.text('TOTAL', 120, doc.y, { width: 34, align: 'right' });
          doc.moveDown(0.2);
          doc.font('Helvetica');

          // Items Loop
          (data.items || []).forEach((item: any) => {
             const startY = doc.y;
             doc.fontSize(6).text(item.product_name, 10, startY, { width: 80 });
             const nextY = doc.y;
             doc.text(item.quantity.toString(), 100, startY, { width: 20, align: 'center' });
             doc.text(Number(item.subtotal).toLocaleString(), 120, startY, { width: 34, align: 'right' });
             doc.y = Math.max(nextY, startY + 8);
             doc.moveDown(0.1);
          });

          doc.moveDown(0.5);
          doc.fontSize(6).text('-'.repeat(45), { align: 'center' });
          doc.moveDown(0.5);

          // Total Section
          doc.fontSize(8).font('Helvetica-Bold').text('TOTAL HARGA', 10, doc.y, { continued: true });
          doc.text(`Rp ${Number(tinfo.total_amount).toLocaleString()}`, 10, doc.y, { align: 'right' });
          
          doc.moveDown(1.5);
          doc.fontSize(6).font('Helvetica-Oblique').text(data.footer || 'Terima Kasih Atas Kunjungan Anda!', { align: 'center' });
          doc.moveDown(0.5);
          doc.fillColor('#999999').fontSize(5).text('Power by Kopi Nganjuk POS', { align: 'center' });
          doc.fillColor('black'); // Reset color 
          
          doc.end();
          return;
        }
      }

      // 4. Tangani response standar (JSON atau Text sebagai fallback)
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        data = { message: textData };
      }

      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[Proxy Error]:", error);
      res.status(500).json({ 
        success: false, 
        message: "Proxy gagal terhubung ke API backend.", 
        error: error.message 
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.send('POS Proxy System is running...');
  });

  // Vite middleware untuk development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
