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
};
