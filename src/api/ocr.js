import { Mistral } from "@mistralai/mistralai";

const getClient = (apiKey) => new Mistral({ apiKey });

/**
 * Converts a File or Blob object to a base64 Data URL.
 * @param {Blob|File} blob 
 * @returns {Promise<string>}
 */
export const blobToDataUrl = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

/**
 * Extracts text from an image (Blob, File, or base64 data URL) using Mistral OCR API.
 * @param {string} apiKey - Mistral API key
 * @param {Blob|File|string} imageInput - Image file, blob or data URL
 * @returns {Promise<string>} - Extracted markdown/text
 */
export const extractTextFromScreenshot = async (apiKey, imageInput) => {
  if (!apiKey) {
    throw new Error('Mistral API Key is required for OCR');
  }

  let dataUrl;
  if (typeof imageInput === 'string') {
    dataUrl = imageInput;
  } else if (imageInput instanceof Blob) {
    dataUrl = await blobToDataUrl(imageInput);
  } else {
    throw new Error('Unsupported image input format');
  }

  const client = getClient(apiKey);

  try {
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        imageUrl: dataUrl,
      },
    });

    if (!response || !response.pages || response.pages.length === 0) {
      return '';
    }

    const fullText = response.pages
      .map((page) => page.markdown?.trim() || '')
      .filter(Boolean)
      .join('\n\n');

    return fullText;
  } catch (error) {
    const errorMsg = error.message ? error.message.toLowerCase() : '';
    if (errorMsg.includes('safety') || errorMsg.includes('policy') || errorMsg.includes('moderation') || errorMsg.includes('blocked')) {
      throw new Error('Content blocked by Mistral safety filters');
    }
    if (errorMsg.includes('unauthorized') || errorMsg.includes('api key') || error.status === 401) {
      throw new Error('Invalid Mistral API Key');
    }
    throw error;
  }
};
