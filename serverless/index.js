const fetch = require('node-fetch');

/**
 * Универсальная Cloud Function для обхода CORS.
 * Поддерживает GET и POST запросы, а также проброс заголовков.
 */
exports.fetchHtml = async (req, res) => {
  // Настройка CORS заголовков
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // Разрешаем заголовок Authorization, который нужен для YouTube API
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Извлечение и проверка целевого URL
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Ошибка: Параметр "url" обязателен.');
  }

  try {
    // Формируем конфиг запроса на основе входящего запроса к прокси
    const fetchOptions = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, image/avif, image/webp, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000 // Таймаут 15 секунд
    };

    // Если клиент прислал Authorization (токен YouTube), пробрасываем его
    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }

    // Если это POST, пробрасываем Content-Type и тело
    if (req.method === 'POST') {
      fetchOptions.headers['Content-Type'] = req.headers['content-type'] || 'application/json';
      // Если тело уже распарсено (например, через body-parser), преобразуем обратно в строку
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Выполнение запроса к целевому сайту
    const response = await fetch(targetUrl, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(`Ошибка прокси (${response.status}): ${errorText || response.statusText}`);
    }

    // Определение типа контента для корректного возврата
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      res.status(200).json(json);
    } else {
      const text = await response.text();
      res.status(200).send(text);
    }

  } catch (error) {
    console.error(`Fetch error for ${targetUrl}:`, error);
    res.status(500).send(`Внутренняя ошибка прокси при скачивании: ${error.message}`);
  }
};
