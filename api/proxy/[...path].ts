import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from "pdfkit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Dapatkan Target URL
  const targetBaseUrl = (req.headers['x-target-base-url'] as string) || "https://pos-api.nganjuk.net/api";
  
  // Ambil token dari header atau query string
  const queryToken = req.query.token as string;
  const authHeader = req.headers['authorization'] || (queryToken ? `Bearer ${queryToken}` : undefined);
  
  // URL cleanup
  // req.url on Vercel contains everything. 
  // For dynamic route api/proxy/[...path].ts, req.query.path is an array of segments.
  const pathSegments = (req.query.path as string[]) || [];
  const apiPath = '/' + pathSegments.join('/');
  
  const cleanBaseUrl = targetBaseUrl.endsWith('/') ? targetBaseUrl.slice(0, -1) : targetBaseUrl;
  
  // Reconstruct query parameters from req.url
  const urlParts = (req.url || '').split('?');
  const queryString = urlParts.length > 1 ? '?' + urlParts[1] : '';
  const finalUrl = `${cleanBaseUrl}${apiPath}${queryString}`;

  console.log(`[Vercel Proxy] ${req.method} ${apiPath} -> ${finalUrl}`);

  try {
    const options: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || ''
      }
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method!)) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(finalUrl, options);
    
    // PDF Logic for Print
    if (apiPath.startsWith('/sales/print/') && response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const doc = new PDFDocument({ 
          size: [164, 400], 
          margin: 10,
          bufferPages: true 
        }); 
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=receipt-${data.transaction_info?.id || 'id'}.pdf`);
        
        doc.pipe(res);
        
        // Render PDF (Copy logic from server.ts)
        doc.fontSize(10).font('Helvetica-Bold').text(data.store_name.toUpperCase(), { align: 'center' });
        doc.fontSize(6).font('Helvetica').text(data.store_address, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(6).text('='.repeat(45), { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(6);
        const tinfo = data.transaction_info || data.sale || data;
        const tid = tinfo.id || data.id || '-';
        const dateStr = (tinfo.created_at || tinfo.date) ? new Date(tinfo.created_at || tinfo.date).toLocaleString('id-ID', {
          dateStyle: 'short',
          timeStyle: 'short'
        }) : '-';
        
        doc.font('Helvetica-Bold').text('NO TRX  : ', { continued: true }).font('Helvetica').text(`#TRX-${tid}`);
        doc.font('Helvetica-Bold').text('TANGGAL : ', { continued: true }).font('Helvetica').text(dateStr);
        doc.font('Helvetica-Bold').text('KASIR   : ', { continued: true }).font('Helvetica').text(tinfo.cashier_name || data.cashier_name || 'Admin');
        doc.font('Helvetica-Bold').text('METODE  : ', { continued: true }).font('Helvetica').text(tinfo.payment_method || data.payment_method || 'Cash');
        
        doc.moveDown(0.5);
        doc.fontSize(6).text('-'.repeat(45), { align: 'center' });
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold');
        doc.text('ITEM', 10, doc.y, { width: 80, continued: true });
        doc.text('QTY', 100, doc.y, { width: 20, align: 'center', continued: true });
        doc.text('TOTAL', 120, doc.y, { width: 34, align: 'right' });
        doc.moveDown(0.2);
        doc.font('Helvetica');

        const items = data.items || tinfo.items || [];
        items.forEach((item: any) => {
           const startY = doc.y;
           doc.fontSize(6).text(item.product_name || item.name || 'Produk', 10, startY, { width: 80 });
           const nextY = doc.y;
           doc.text((item.quantity || item.qty || 0).toString(), 100, startY, { width: 20, align: 'center' });
           doc.text(Number(item.subtotal || item.total || 0).toLocaleString(), 120, startY, { width: 34, align: 'right' });
           doc.y = Math.max(nextY, startY + 8);
           doc.moveDown(0.1);
        });

        doc.moveDown(0.5);
        doc.fontSize(6).text('-'.repeat(45), { align: 'center' });
        doc.moveDown(0.5);

        const totalAmount = tinfo.total_amount || tinfo.total || data.total_amount || tinfo.grand_total || 0;
        doc.fontSize(8).font('Helvetica-Bold').text('TOTAL HARGA', 10, doc.y, { continued: true });
        doc.text(`Rp ${Number(totalAmount).toLocaleString()}`, 10, doc.y, { align: 'right' });
        
        doc.moveDown(1.5);
        doc.fontSize(6).font('Helvetica-Oblique').text(data.footer || 'Terima Kasih Atas Kunjungan Anda!', { align: 'center' });
        doc.moveDown(0.5);
        doc.fillColor('#999999').fontSize(5).text('Power by Kopi Nganjuk POS', { align: 'center' });
        doc.fillColor('black');
        
        doc.end();
        return;
      }
    }

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
    console.error("[Vercel Proxy Error]:", error);
    res.status(500).json({ 
      success: false, 
      message: "Proxy gagal terhubung ke API backend.", 
      error: error.message 
    });
  }
}
