window.onload = () => {
  const chartEl = document.getElementById('studyChart');
  if (chartEl && window.Plotly) {
    const data = [
      {
        type: 'bar',
        x: [
          'Компьютерное зрение',
          'Веб-разработка',
          'Стохастические модели',
          'Суперкомпьютерное моделирование',
        ],
        y: [8, 4, 6, 4],
        marker: {
          color: ['#273a52', '#355c7d', '#4e7ba7', '#7fa6c9'],
          line: {
            color: '#ffffff',
            width: 1.5,
          },
        },
        hovertemplate: '%{x}<br>Академических часов: %{y}<extra></extra>',
      },
    ];

    const layout = {
      margin: { t: 24, r: 20, b: 60, l: 48 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(255,255,255,0.78)',
      font: {
        family: 'Manrope, system-ui, sans-serif',
        color: '#1f1d1a',
      },
      xaxis: {
        tickangle: 0,
        automargin: true,
        gridcolor: 'rgba(31,29,26,0.06)',
      },
      yaxis: {
        title: 'Академические часы',
        rangemode: 'tozero',
        gridcolor: 'rgba(31,29,26,0.08)',
        zerolinecolor: 'rgba(31,29,26,0.1)',
      },
      bargap: 0.28,
    };

    const config = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
    };

    Plotly.newPlot(chartEl, data, layout, config);
    window.addEventListener('resize', () => Plotly.Plots.resize(chartEl));
  }

  const form = document.getElementById('contactForm');
  const formAlert = document.getElementById('formAlert');

  if (form && formAlert) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      form.classList.remove('was-validated');
      form.reset();
      formAlert.classList.remove('d-none');

      window.setTimeout(() => {
        formAlert.classList.add('d-none');
      }, 3500);
    });
  }
};
