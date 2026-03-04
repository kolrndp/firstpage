window.onload = () => {
  const canvas = document.getElementById('drawCanvas');
  const clearBtn = document.getElementById('clearCanvas');

  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const state = {
        drawing: false,
        lastX: 0,
        lastY: 0,
      };

      const setStyles = () => {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(233,238,247,1)';
      };

      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        setStyles();
      };

      const getPoint = (event) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      };

      const startDraw = (event) => {
        state.drawing = true;
        const point = getPoint(event);
        state.lastX = point.x;
        state.lastY = point.y;
        ctx.beginPath();
        ctx.moveTo(state.lastX, state.lastY);
      };

      const draw = (event) => {
        if (!state.drawing) return;
        const point = getPoint(event);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        state.lastX = point.x;
        state.lastY = point.y;
      };

      const stopDraw = () => {
        state.drawing = false;
        ctx.closePath();
      };

      canvas.addEventListener('pointerdown', (event) => {
        canvas.setPointerCapture(event.pointerId);
        startDraw(event);
      });

      canvas.addEventListener('pointermove', draw);
      canvas.addEventListener('pointerup', stopDraw);
      canvas.addEventListener('pointerleave', stopDraw);
      canvas.addEventListener('pointercancel', stopDraw);

      window.addEventListener('resize', resizeCanvas);

      resizeCanvas();

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
      }
    }
  }

  const mapEl = document.getElementById('map');
  if (mapEl && window.L) {
    const map = L.map('map').setView([55.80337, 37.41001], 12);
    map.attributionControl.setPrefix('');

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([55.80337, 37.41001]).addTo(map).bindPopup('МИЭМ НИУ ВШЭ');
  }

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatVoice = document.getElementById('chatVoice');
  const chatRecordStatus = document.getElementById('chatRecordStatus');
  const chatRecordTime = document.getElementById('chatRecordTime');
  const chatTyping = document.getElementById('chatTyping');
  const chatClear = document.getElementById('chatClear');

  if (chatMessages && chatInput && chatSend && chatVoice) {
    const formatTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const setStatus = (statusEl, status) => {
      const map = {
        sending: '⌛',
        sent: '✓',
        delivered: '✓✓',
      };
      statusEl.dataset.status = status;
      statusEl.textContent = map[status] || '';
    };

    const addMessage = ({ side, text }) => {
      const msg = document.createElement('div');
      msg.className = `msg msg--${side}`;

      const bubble = document.createElement('div');
      bubble.className = 'msg__bubble';

      const content = document.createElement('p');
      content.className = 'msg__text';
      content.textContent = text;

      const meta = document.createElement('div');
      meta.className = 'msg__meta';

      const time = document.createElement('span');
      time.textContent = formatTime();

      meta.appendChild(time);

      let statusEl = null;
      if (side === 'me') {
        statusEl = document.createElement('span');
        statusEl.className = 'msg__status';
        setStatus(statusEl, 'sending');
        meta.appendChild(statusEl);
      }

      bubble.appendChild(content);
      bubble.appendChild(meta);
      msg.appendChild(bubble);
      if (chatTyping && !chatTyping.hidden) {
        chatMessages.insertBefore(msg, chatTyping);
      } else {
        chatMessages.appendChild(msg);
      }

      chatMessages.scrollTop = chatMessages.scrollHeight;
      return statusEl;
    };

    const addAudioMessage = (url) => {
      const msg = document.createElement('div');
      msg.className = 'msg msg--me';

      const bubble = document.createElement('div');
      bubble.className = 'msg__bubble';

      const controls = document.createElement('div');
      controls.className = 'msg__audio-controls';

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'msg__play';
      playBtn.textContent = '▶';

      const duration = document.createElement('span');
      duration.className = 'msg__duration';
      duration.textContent = '0:00';

      controls.appendChild(playBtn);
      controls.appendChild(duration);

      const audio = document.createElement('audio');
      audio.className = 'msg__audio';
      audio.controls = false;
      audio.src = url;
      audio.preload = 'metadata';

      const meta = document.createElement('div');
      meta.className = 'msg__meta';

      const time = document.createElement('span');
      time.textContent = formatTime();
      meta.appendChild(time);

      const statusEl = document.createElement('span');
      statusEl.className = 'msg__status';
      setStatus(statusEl, 'sending');
      meta.appendChild(statusEl);

      const formatAudioDuration = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
      };

      audio.addEventListener('loadedmetadata', () => {
        duration.textContent = formatAudioDuration(audio.duration);
      });

      const setPlayState = (isPlaying) => {
        playBtn.textContent = isPlaying ? '⏸' : '▶';
      };

      playBtn.addEventListener('click', () => {
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      });

      audio.addEventListener('play', () => setPlayState(true));
      audio.addEventListener('pause', () => setPlayState(false));
      audio.addEventListener('ended', () => setPlayState(false));

      bubble.appendChild(controls);
      bubble.appendChild(audio);
      bubble.appendChild(meta);
      msg.appendChild(bubble);
      if (chatTyping && !chatTyping.hidden) {
        chatMessages.insertBefore(msg, chatTyping);
      } else {
        chatMessages.appendChild(msg);
      }

      chatMessages.scrollTop = chatMessages.scrollHeight;
      return statusEl;
    };

    const randomBetween = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const simulateMyStatuses = (statusEl) => {
      if (!statusEl) return;
      setTimeout(() => setStatus(statusEl, 'sent'), randomBetween(300, 700));
      setTimeout(() => setStatus(statusEl, 'delivered'), randomBetween(800, 1500));
    };

    let typingCount = 0;
    let hasUserMessaged = false;
    const setTypingVisible = (visible) => {
      if (!chatTyping) return;
      chatTyping.hidden = !visible;
    };

    const showTyping = () => {
      if (!hasUserMessaged) return;
      typingCount += 1;
      if (chatTyping) {
        chatMessages.appendChild(chatTyping);
      }
      setTypingVisible(true);
    };

    const hideTyping = () => {
      typingCount = Math.max(0, typingCount - 1);
      if (typingCount === 0) setTypingVisible(false);
    };

    const pendingReplies = new Set();

    const autoReply = (userText) => {
      const text = userText.toLowerCase();
      let reply = '';

      if (text.includes('привет') || text.includes('здрав')) {
        reply = 'Привет! Чем могу помочь?';
      } else if (text.includes('распис')) {
        reply = 'Расписание моей группы на главной странице.';
      } else if (text.includes('учёб') || text.includes('учеб') || text.includes('курс') || text.includes('пара')) {
        const studyReplies = [
          'Учебная нагрузка сейчас высокая, потому что сейчас конец последнего модуля 4го курса.',
          'Больше всего времени уходит на учёбу и подготовку ВКР.',
          'Много времени уходт на учебный проект.',
        ];
        reply = studyReplies[Math.floor(Math.random() * studyReplies.length)];
      } else if (text.includes('спасибо')) {
        reply = 'Пожалуйста! Рад был помочь.';
      } else {
        const fallback = [
          'Интересно. Расскажи подробнее.',
          'Понял. Могу уточнить детали?',
          'Хорошо, я подумаю над этим.',
          'Принял. Спасибо за сообщение.',
        ];
        reply = fallback[Math.floor(Math.random() * fallback.length)];
      }

      showTyping();
      const timerId = setTimeout(() => {
        pendingReplies.delete(timerId);
        hideTyping();
        addMessage({ side: 'bot', text: reply });
      }, randomBetween(600, 1500));
      pendingReplies.add(timerId);
    };

    const sendMessage = () => {
      const text = chatInput.value.trim();
      if (!text) return;

      hasUserMessaged = true;
      const statusEl = addMessage({ side: 'me', text });
      simulateMyStatuses(statusEl);
      chatInput.value = '';
      autoReply(text);
    };

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    });

    if (chatClear) {
      chatClear.addEventListener('click', () => {
        chatMessages.querySelectorAll('.msg').forEach((node) => node.remove());
        pendingReplies.forEach((id) => clearTimeout(id));
        pendingReplies.clear();
        typingCount = 0;
        setTypingVisible(false);
        chatMessages.scrollTop = 0;
      });
    }

    const showToast = (text) => {
      const toast = document.createElement('div');
      toast.className = 'chat__toast';
      toast.textContent = text;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    };

    const showRecordStatus = (isRecording) => {
      if (!chatRecordStatus) return;
      chatRecordStatus.hidden = !isRecording;
    };

    let recorder = null;
    let recording = false;
    let stream = null;
    let chunks = [];
    let recordTimer = null;
    let recordLimitTimer = null;
    let recordStart = 0;

    const formatDuration = (ms) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      return `${minutes}:${seconds}`;
    };

    const updateRecordTime = () => {
      if (!chatRecordTime) return;
      const elapsed = Date.now() - recordStart;
      chatRecordTime.textContent = formatDuration(elapsed);
    };

    const startRecording = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Нет доступа к микрофону');
        return;
      }

      try {
        if (!stream || !stream.active) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (error) {
        showToast('Нет доступа к микрофону');
        return;
      }

      recorder = new MediaRecorder(stream);
      chunks = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => {
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const statusEl = addAudioMessage(url);
        simulateMyStatuses(statusEl);
        autoReply('голосовое');
      });

      recorder.start();
      recording = true;
      chatVoice.setAttribute('aria-pressed', 'true');
      chatVoice.textContent = '⏹ Стоп';
      showRecordStatus(true);
      recordStart = Date.now();
      updateRecordTime();
      recordTimer = setInterval(updateRecordTime, 250);
      recordLimitTimer = setTimeout(() => stopRecording(), 30000);
    };

    const stopRecording = () => {
      if (recorder && recording) {
        recorder.stop();
      }
      recording = false;
      chatVoice.setAttribute('aria-pressed', 'false');
      chatVoice.textContent = '🎤';
      showRecordStatus(false);
      if (recordTimer) {
        clearInterval(recordTimer);
        recordTimer = null;
      }
      if (recordLimitTimer) {
        clearTimeout(recordLimitTimer);
        recordLimitTimer = null;
      }
      if (chatRecordTime) {
        chatRecordTime.textContent = '00:00';
      }
    };

    chatVoice.addEventListener('click', async () => {
      if (recording) {
        stopRecording();
        return;
      }

      await startRecording();
    });
  }
};
