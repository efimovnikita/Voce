const fetch = require('node-fetch');

/**
 * Cloud Function для скачивания HTML контента.
 * Разрешает CORS запросы для использования во фронтенд-приложениях.
 */
exports.fetchHtml = async (req, res) => {
  // Настройка CORS заголовков
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // Извлечение и проверка целевого URL
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Ошибка: Параметр "url" обязателен.');
  }

  try {
    // Выполнение запроса к целевому сайту с реалистичным User-Agent
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000 // Таймаут 15 секунд
    });

    if (!response.ok) {
      return res.status(response.status).send(`Ошибка при загрузке страницы (${response.status}): ${response.statusText}`);
    }

    const html = await response.text();
    
    // Возврат сырого HTML клиенту
    res.status(200).send(html);

  } catch (error) {
    console.error(`Fetch error for ${targetUrl}:`, error);
    res.status(500).send(`Внутренняя ошибка сервера при скачивании: ${error.message}`);
  }
};
