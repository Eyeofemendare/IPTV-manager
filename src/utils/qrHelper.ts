import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0b0f17',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR generation error', err);
    return '';
  }
}
