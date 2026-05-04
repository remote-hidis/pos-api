import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from "pdfkit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Dapatkan Target URL
  let targetBaseUrl = (req.query.target as string) || (req.headers['x-target-base-url'] as string) || "https://api-pos.nganjuk.net";
  
  // Auto-correct old domain if it somehow leaks through
  if (targetBaseUrl.includes('pos-api.nganjuk.net')) {
    targetBaseUrl = targetBaseUrl.replace('pos-api.nganjuk.net', 'api-pos.nganjuk.net');
  }
  
  // Ambil token dari header atau query string
  const queryToken = req.query.token as string;
  const authHeader = req.headers['authorization'] || (queryToken ? `Bearer ${queryToken}` : undefined);
  
  // URL cleanup local path
  const url = req.url || '';
  const pathPart = url.split('?')[0];
  const apiPath = pathPart.replace('/api/proxy', '');
  
  // Clean slash mapping
  const cleanBaseUrl = targetBaseUrl.endsWith('/') ? targetBaseUrl.slice(0, -1) : targetBaseUrl;
  
  // Reconstruct query parameters
  const urlParts = url.split('?');
  const queryString = urlParts.length > 1 ? '?' + urlParts[1] : '';
  
  // Ensure we don't have double /api if both have it
  let relativePath = apiPath;
  if (cleanBaseUrl.endsWith('/api') && relativePath.startsWith('/api/')) {
    relativePath = relativePath.substring(4);
  }

  const finalUrl = `${cleanBaseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}${queryString}`;

  console.log(`[Vercel Proxy Dynamic] ${req.method} ${apiPath} -> ${finalUrl}`);

  try {
    const options: RequestInit = {
      method: req.method,
      headers: {
        'Authorization': authHeader || ''
      },
      // @ts-ignore - signal might not be in RequestInit for some types
      signal: AbortSignal.timeout(10000) 
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method!)) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(finalUrl, options);
    
    // PDF Logic for Print
    if (apiPath.includes('/sales/print/') && response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const doc = new PDFDocument({ 
          size: [164, 450], 
          margin: 10,
          bufferPages: true 
        }); 
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=receipt-${data.transaction_info?.id || 'id'}.pdf`);
        
        doc.pipe(res);
        
        // Render PDF 
        doc.fontSize(10).font('Helvetica-Bold').text(data.store_name.toUpperCase(), { align: 'center' });
        doc.fontSize(6).font('Helvetica').text(data.store_address, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(6).text('='.repeat(45), { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(6);
        // Data extraction based on your provided JSON structure
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

        doc.font('Helvetica-Bold');
        doc.text('ITEM', 10, doc.y, { width: 80, continued: true });
        doc.text('QTY', 90, doc.y, { width: 20, align: 'center', continued: true });
        doc.text('TOTAL', 115, doc.y, { width: 39, align: 'right' });
        doc.moveDown(0.2);
        doc.font('Helvetica');

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

        const totalAmount = tinfo.total_amount || 0;
        doc.fontSize(8).font('Helvetica-Bold').text('TOTAL HARGA', 10, doc.y, { continued: true });
        doc.text(`Rp ${Number(totalAmount).toLocaleString()}`, 115, doc.y, { align: 'right' });
        
        doc.moveDown(1.5);
        doc.fontSize(6).font('Helvetica-Oblique').text(data.footer || 'Terima Kasih Atas Kunjungan Anda!', { align: 'center' });
        doc.moveDown(0.5);
        doc.fillColor('#999999').fontSize(5).text('Powered by Kopi Nganjuk POS', { align: 'center' });
        doc.fillColor('black');
        
        doc.end();
        return;
      }
    }

    const contentType = response.headers.get("content-type");
    let responseData;
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      const textData = await response.text();
      responseData = { message: textData };
    }

    res.status(response.status).json(responseData);
  } catch (error: any) {
    console.error("[Vercel Proxy Error]:", error);
    res.status(500).json({ 
      success: false, 
      message: "Proxy gagal terhubung ke API backend.", 
      target: finalUrl,
      error: error.message 
    });
  }
}
