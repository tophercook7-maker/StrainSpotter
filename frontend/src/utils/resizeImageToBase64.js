export async function resizeImageToBase64(file, maxWidth = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Failed to create blob'));
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result || '';
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            // Clean up object URL
            URL.revokeObjectURL(img.src);
            resolve({ base64, contentType: 'image/jpeg' });
          };
          reader.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to read blob'));
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

