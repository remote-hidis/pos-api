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
    let targetBaseUrl = (req.query.target as string) || (req.headers['x-target-base-url'] as string) || "https://api-pos.nganjuk.net";
    
    // Auto-correct old domain
    if (targetBaseUrl.includes('pos-api.nganjuk.net')) {
      targetBaseUrl = targetBaseUrl.replace('pos-api.nganjuk.net', 'api-pos.nganjuk.net');
    }

    // Ambil token dari header atau query string (untuk window.open)
    const queryToken = req.query.token as string;
    const authHeader = req.headers['authorization'] || (queryToken ? `Bearer ${queryToken}` : undefined);
    
    // In app.use, req.url is relative to /api/proxy
    const apiPath = req.url.split('?')[0]; 
    const cleanBaseUrl = targetBaseUrl.endsWith('/') ? targetBaseUrl.slice(0, -1) : targetBaseUrl;
    
    // Smart merge to avoid double /api
    let relativePath = req.url;
    if (cleanBaseUrl.endsWith('/api') && relativePath.startsWith('/api/')) {
        relativePath = relativePath.substring(4);
    }
    const finalUrl = `${cleanBaseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;

    console.log(`[Proxy] ${req.method} ${apiPath} -> ${finalUrl}`);

    try {
      const options: RequestInit = {
        method: req.method,
        headers: {
          'Authorization': authHeader || ''
        }
      };

      // 3. Forward body untuk request yang membutuhkan data
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        };
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(finalUrl, options);
      
      // Khusus untuk endpoint print, jika user minta PDF (atau default untuk path ini)
      if (apiPath.includes('/sales/print/') && response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          // Ukuran kertas thermal 58mm (kurang lebih 164pt lebar)
          const doc = new PDFDocument({ 
            size: [164, 450], 
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
          const tinfo = data.transaction_info || {};
          const tid = tinfo.id || '-';
          
          const dateStr = tinfo.created_at ? new Date(tinfo.created_at).toLocaleString('id-ID', {
            dateStyle: 'short',
            timeStyle: 'short'
          }) : '-';
          
          doc.font('Helvetica-Bold').text('NO TRX  : ', { continued: true }).font('Helvetica').text(`#TRX-${tid}`);
          doc.font('Helvetica-Bold').text('TANGGAL : ', { continued: true }).font('Helvetica').text(dateStr);
          doc.font('Helvetica-Bold').text('KASIR   : ', { continued: true }).font('Helvetica').text(tinfo.cashier_name || 'Admin');
          doc.font('Helvetica-Bold').text('METODE  : ', { continued: true }).font('Helvetica').text(tinfo.payment_method || 'Cash');
          
          doc.moveDown(0.5);
          doc.fontSize(6).text('-'.repeat(45), { align: 'center' });
          doc.moveDown(0.5);

          // Items Header
          doc.font('Helvetica-Bold');
          doc.text('ITEM', 10, doc.y, { width: 80, continued: true });
          doc.text('QTY', 90, doc.y, { width: 20, align: 'center', continued: true });
          doc.text('TOTAL', 115, doc.y, { width: 39, align: 'right' });
          doc.moveDown(0.2);
          doc.font('Helvetica');

          // Items Loop
          const items = data.items || [];
          items.forEach((item: any) => {
             const startY = doc.y;
             doc.fontSize(6).text(item.product_name || 'Produk', 10, startY, { width: 80 });
             const nextY = doc.y;
             doc.text((item.quantity || 0).toString(), 90, startY, { width: 20, align: 'center' });
             doc.text(Number(item.subtotal || 0).toLocaleString(), 115, startY, { width: 39, align: 'right' });
             doc.y = Math.max(nextY, startY + 8);
             doc.moveDown(0.1);
          });

          doc.moveDown(0.5);
          doc.fontSize(6).text('-'.repeat(45), { align: 'center' });
          doc.moveDown(0.5);

          // Total Section
          const totalAmount = tinfo.total_amount || 0;
          doc.fontSize(8).font('Helvetica-Bold').text('TOTAL HARGA', 10, doc.y, { continued: true });
          doc.text(`Rp ${Number(totalAmount).toLocaleString()}`, 115, doc.y, { align: 'right' });
          
          doc.moveDown(1.5);
          doc.fontSize(6).font('Helvetica-Oblique').text(data.footer || 'Terima Kasih Atas Kunjungan Anda!', { align: 'center' });
          doc.moveDown(0.5);
          doc.fillColor('#999999').fontSize(5).text('Powered by Kopi Nganjuk POS', { align: 'center' });
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
