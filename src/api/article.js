import { Readability } from '@mozilla/readability';

/**  
 * Извлекает чистый текстовый контент по предоставленному URL используя CORS Proxy.  
 * @param {string} url - Веб-адрес статьи для извлечения.  
 * @param {string} proxyUrl - URL вашей серверной функции-прокси.  
 * @returns {Promise<Object>} Объект, содержащий заголовок, текст и метаданные.  
 */  
export async function fetchAndParseArticle(url, proxyUrl) {  
  try {  
    // 1. Запрос к вашей серверной функции
    // Убедимся, что proxyUrl не заканчивается на слеш для корректной конкатенации
    const baseProxy = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
    const endpoint = `${baseProxy}?url=${encodeURIComponent(url)}`;  
      
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка прокси-сервера (${response.status}): ${errorText || response.statusText}`);
    }
      
    // Наша функция возвращает сырой HTML напрямую
    const rawHtml = await response.text();
      
    if (typeof rawHtml !== 'string' || !rawHtml.includes('<html')) {  
        throw new Error("Неверный формат ответа: ожидался HTML-контент. Проверьте URL прокси-сервера.");  
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
