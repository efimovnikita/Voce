# **Техническая спецификация: Серверная функция (CORS Proxy для извлечения контента)**

## **1. Цель**
Заменить сторонний платный сервис (OpenGraph.io) на собственную легковесную серверную функцию (Serverless Function). Функция должна выступать в роли прокси-сервера: принимать URL, скачивать сырой HTML-контент целевой страницы и возвращать его в браузер с необходимыми CORS-заголовками.

## **2. Выбор платформы: Google Cloud Functions (2nd Gen)**
**Почему GCP?**
*   **Бесплатный уровень (Always Free):** До 2 млн вызовов в месяц и 1 ГБ исходящего трафика бесплатно. При 100-200 запросах в день затраты составят $0.
*   **Производительность:** Быстрое время холодного старта и глобальная сеть Google.
*   **Простота:** Деплой одной командой через `gcloud CLI` или через веб-консоль.

## **3. Архитектура функции**

### **Входные данные (Request)**
*   **Метод:** `GET`
*   **Параметры (Query Params):**
    *   `url`: Валидный URL-адрес страницы (например, `https://example.com/article`).

### **Логика обработки**
1.  **Проверка CORS:** Обработка `OPTIONS` запроса (preflight) для разрешения доступа из браузера.
2.  **Валидация:** Проверка наличия параметра `url`.
3.  **Загрузка:** Выполнение HTTP-запроса к целевому URL с подменой `User-Agent` (чтобы избежать блокировок "бот-детекторов").
4.  **Таймаут:** Установка лимита в 10-15 секунд на скачивание.

### **Выходные данные (Response)**
*   **Успех (200 OK):** Сырая строка HTML в теле ответа.
*   **Ошибка (400/500):** Сообщение об ошибке в текстовом формате.
*   **Заголовки:** `Access-Control-Allow-Origin: *` (или домен вашего приложения).

## **4. Реализация (Node.js 20+)**

### **Файл: index.js**
```javascript
const fetch = require('node-fetch');

/**
 * Cloud Function для скачивания HTML контента.
 */
exports.fetchHtml = async (req, res) => {
  // 1. Настройка CORS заголовков
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // 2. Извлечение и проверка URL
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Ошибка: Параметр "url" обязателен.');
  }

  try {
    // 3. Выполнение запроса к целевому сайту
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
    
    // 4. Возврат сырого HTML
    res.status(200).send(html);

  } catch (error) {
    console.error(`Fetch error for ${targetUrl}:`, error);
    res.status(500).send(`Внутренняя ошибка сервера: ${error.message}`);
  }
};
```

### **Файл: package.json**
```json
{
  "name": "voce-cors-proxy",
  "version": "1.0.0",
  "dependencies": {
    "node-fetch": "^2.6.11"
  }
}
```

## **5. Инструкция по развертыванию**

Для деплоя функции через терминал (при установленном Google Cloud SDK):

```bash
gcloud functions deploy fetch-html \
  --gen2 \
  --runtime=nodejs20 \
  --region=europe-west3 \
  --source=. \
  --entry-point=fetchHtml \
  --trigger-http \
  --allow-unauthenticated
```

После деплоя вы получите URL вида:
`https://fetch-html-xxxxxxx-ew.a.run.app`

## **6. Интеграция в приложение**
В коде фронтенда (файл `src/api/article.js`) необходимо заменить endpoint OpenGraph на:
`const endpoint = `${proxyUrl}?url=${encodeURIComponent(url)}`;`

В настройках приложения поле "OpenGraph API Key" заменяется на "CORS Proxy URL".
