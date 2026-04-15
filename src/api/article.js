import { Readability } from '@mozilla/readability';

/**  
 * Извлекает чистый текстовый контент по предоставленному URL.  
 * @param {string} url - Веб-адрес статьи для извлечения.  
 * @param {string} apiKey - API-ключ от сервиса opengraph.io.  
 * @returns {Promise<Object>} Объект, содержащий заголовок, текст и метаданные.  
 */  
export async function fetchAndParseArticle(url, apiKey) {  
  try {  
    // 1. Запрос к OpenGraph.io для получения HTML  
    const endpoint = `https://opengraph.io/api/1.1/scrape/${encodeURIComponent(url)}?app_id=${apiKey}`;  
      
    const response = await fetch(endpoint);
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorDetails = "";
      try {
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errorDetails = errData.error || errData.message || "";
        }
      } catch (e) {
        // Игнорируем ошибку парсинга ошибки
      }
      throw new Error(`Ошибка API OpenGraph (${response.status}): ${errorDetails || response.statusText}`);
    }
      
    let rawHtml;
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      rawHtml = data.html || data.htmlContent || (typeof data === 'string' ? data : null);
    } else {
      // Если вернулся не JSON, пробуем прочитать как текст (возможно, это и есть HTML)
      rawHtml = await response.text();
    }
      
    if (typeof rawHtml !== 'string' || !rawHtml.includes('<html')) {  
        throw new Error("Неверный формат ответа: ожидался HTML-контент");  
    }

    // 2. Создание виртуального DOM из строки HTML  
    const parser = new DOMParser();  
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Проверка на базовую валидность полученного документа
    if (!doc || !doc.body || doc.body.innerHTML.trim() === "") {
        throw new Error("Получен пустой или невалидный HTML");
    }

    // 3. Извлечение чистого текста с помощью Readability  
    const reader = new Readability(doc);  
    const article = reader.parse();

    if (!article || !article.textContent) {  
        throw new Error("Readability не смог извлечь текст из этой страницы.");  
    }

    return article;

  } catch (error) {  
    console.error("Ошибка во время извлечения статьи:", error);  
    throw error;  
  }  
}
