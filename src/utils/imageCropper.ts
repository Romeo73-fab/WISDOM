/**
 * Utility to auto-trim transparent margins and whitespace from logo images
 * so that uploaded logos always render centered, bold, and without excessive padding.
 */
export async function autoCropLogo(
  fileOrUrl: File | string,
  paddingPercent = 0.04
): Promise<{ dataUrl: string; croppedFile?: File; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve({
            dataUrl: typeof fileOrUrl === 'string' ? fileOrUrl : '',
            width: img.width,
            height: img.height,
          });
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let minX = canvas.width;
        let maxX = 0;
        let minY = canvas.height;
        let maxY = 0;
        let hasContent = false;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];
            // Check for non-transparent pixels
            if (alpha > 15) {
              hasContent = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // If no transparent pixels found or entire image is solid
        if (!hasContent || minX > maxX || minY > maxY) {
          const fallbackDataUrl = canvas.toDataURL('image/png');
          return resolve({
            dataUrl: fallbackDataUrl,
            width: canvas.width,
            height: canvas.height,
          });
        }

        // Add padding
        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;
        const padX = Math.max(4, Math.round(contentW * paddingPercent));
        const padY = Math.max(4, Math.round(contentH * paddingPercent));

        const cropMinX = Math.max(0, minX - padX);
        const cropMaxX = Math.min(canvas.width - 1, maxX + padX);
        const cropMinY = Math.max(0, minY - padY);
        const cropMaxY = Math.min(canvas.height - 1, maxY + padY);

        const cropWidth = cropMaxX - cropMinX + 1;
        const cropHeight = cropMaxY - cropMinY + 1;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        const cropCtx = cropCanvas.getContext('2d');

        if (!cropCtx) {
          return resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height,
          });
        }

        cropCtx.drawImage(
          canvas,
          cropMinX,
          cropMinY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        const finalDataUrl = cropCanvas.toDataURL('image/png');

        // Create a File object if possible
        cropCanvas.toBlob((blob) => {
          let croppedFile: File | undefined;
          if (blob) {
            croppedFile = new File(
              [blob],
              typeof fileOrUrl !== 'string' ? fileOrUrl.name : 'logo.png',
              { type: 'image/png' }
            );
          }
          resolve({
            dataUrl: finalDataUrl,
            croppedFile,
            width: cropWidth,
            height: cropHeight,
          });
        }, 'image/png');
      } catch (err) {
        console.warn('Auto-crop canvas warning:', err);
        // Fallback to original image data
        if (typeof fileOrUrl === 'string') {
          resolve({ dataUrl: fileOrUrl, width: img.width, height: img.height });
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              dataUrl: (e.target?.result as string) || '',
              width: img.width,
              height: img.height,
            });
          };
          reader.readAsDataURL(fileOrUrl);
        }
      }
    };

    img.onerror = (e) => {
      console.warn('Image load error during cropping:', e);
      reject(new Error('Impossible de charger l\'image pour le recadrage automatique.'));
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Lecture du fichier échouée'));
        }
      };
      reader.readAsDataURL(fileOrUrl);
    }
  });
}
