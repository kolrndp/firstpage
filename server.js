const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hse_student';

const submissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    tel: { type: String, trim: true, default: '' },
    date: { type: Date, default: null },
    topic: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    urgent: { type: Boolean, default: false },
    file: {
      originalName: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model('Submission', submissionSchema);

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const sendLocalFile = (fileName) => (req, res) => {
  res.sendFile(path.join(__dirname, fileName));
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const renderLayout = ({ title, heading, subtitle, content }) => `<!DOCTYPE html>
<html lang="ru">
<head>
  <base href="./">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    header{
      background:#0f1116;
      border-bottom:1px solid var(--panel-border);
      padding:18px 0;
    }
    h1{ margin:0; font-size:26px; }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <h1>${escapeHtml(heading)}</h1>
      <p class="muted" style="margin:6px 0 0;">${escapeHtml(subtitle)}</p>
    </div>
  </header>

  <nav aria-label="Основная навигация">
    <div class="wrap nav__links">
      <a href="/index.html">Главная</a>
      <a href="/feedback.html">Обратная связь</a>
      <a href="/map.html">Карта</a>
      <a href="/submissions">Данные</a>
    </div>
  </nav>

  <main class="wrap">
    ${content}
  </main>

  <footer>
    <div class="wrap">
      <p>© <time datetime="2026">2026</time> — учебный проект “Я — студент ВШЭ”.</p>
      <address>Контакты: <a href="/feedback.html">форма обратной связи</a></address>
    </div>
  </footer>
</body>
</html>`;

app.get('/', sendLocalFile('index.html'));
app.get('/index.html', sendLocalFile('index.html'));
app.get('/feedback.html', sendLocalFile('feedback.html'));
app.get('/map.html', sendLocalFile('map.html'));
app.get('/styles.css', sendLocalFile('styles.css'));
app.get('/script.js', sendLocalFile('script.js'));
app.get('/feedback', (req, res) => res.redirect('/feedback.html'));

app.post('/feedback', upload.single('file'), async (req, res, next) => {
  try {
    const { name, email, tel, date, topic, message, urgent } = req.body;

    await Submission.create({
      name,
      email,
      tel: tel || '',
      date: date || null,
      topic,
      message,
      urgent: urgent === 'yes',
      file: req.file
        ? {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
          }
        : undefined,
    });

    res.redirect('/submissions');
  } catch (error) {
    next(error);
  }
});

app.get('/submissions', async (req, res, next) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 }).lean();

    const listMarkup = submissions.length
      ? submissions
          .map((item) => {
            const fileMarkup = item.file && item.file.originalName
              ? `<div><strong>Файл:</strong> ${escapeHtml(item.file.originalName)} (${escapeHtml(item.file.mimeType || 'unknown')}, ${item.file.size} байт)</div>`
              : '<div><strong>Файл:</strong> не загружен</div>';

            const dateMarkup = item.date
              ? formatDate(item.date)
              : 'не указана';

            return `<article class="submission-item">
  <h3>${escapeHtml(item.topic)}</h3>
  <div class="submission-meta">
    <div><strong>Имя:</strong> ${escapeHtml(item.name)}</div>
    <div><strong>Email:</strong> ${escapeHtml(item.email)}</div>
    <div><strong>Телефон:</strong> ${escapeHtml(item.tel || 'не указан')}</div>
    <div><strong>Дата из формы:</strong> ${escapeHtml(dateMarkup)}</div>
    <div><strong>Срочно:</strong> ${item.urgent ? 'да' : 'нет'}</div>
    <div><strong>Сохранено:</strong> ${escapeHtml(formatDate(item.createdAt))}</div>
    ${fileMarkup}
  </div>
  <p class="submission-text">${escapeHtml(item.message)}</p>
</article>`;
          })
          .join('\n')
      : '<div class="submission-empty">Пока нет данных из формы. Сначала отправь сообщение на странице обратной связи.</div>';

    const content = `<section class="card">
  <h2>Полученные данные</h2>
  <p class="muted" style="margin:0 0 12px;">Здесь отображаются все записи, сохранённые в локальной MongoDB.</p>
  <div class="submission-list">
    ${listMarkup}
  </div>
</section>`;

    res.send(
      renderLayout({
        title: 'Я — студент ВШЭ | Данные формы',
        heading: 'Полученные данные',
        subtitle: 'Страница показывает данные, сохранённые из формы обратной связи.',
        content,
      })
    );
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  const content = `<section class="card">
  <h2>Ошибка</h2>
  <p class="muted">Не удалось выполнить запрос к приложению или базе данных.</p>
  <p>${escapeHtml(error.message || 'Неизвестная ошибка')}</p>
</section>`;

  res
    .status(500)
    .send(
      renderLayout({
        title: 'Я — студент ВШЭ | Ошибка',
        heading: 'Ошибка приложения',
        subtitle: 'Проверь запуск MongoDB и повтори попытку.',
        content,
      })
    );
});

const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
