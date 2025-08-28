function populateApps() {
  const examScheduleJSON = JSON.stringify(examSchedule);
  const timerContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timers</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        text-align: center;
        padding: 20px;
        background-color: #f4f4f4;
        color: #333;
        margin: 0;
      }
      h1 {
        color: #333;
        margin-bottom: 20px;
      }
      #timers-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
        margin: 0 auto;
      }
      .timer {
        font-size: 20px;
        font-weight: bold;
        padding: 15px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 250px;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 150px;
      }
      .exam-title {
        font-size: 22px;
        margin-bottom: 10px;
        color: #444;
      }
      .countdown {
        font-size: 18px;
        font-weight: normal;
        margin-top: 10px;
      }
      .ongoing {
        color: #FF0000;
        font-weight: bold;
      }
      .hidden {
        display: none;
      }
    </style>
  </head>
  <body>
    <h1>List of Events</h1>
    <div id="timers-container"></div>
    <script>
      const examSchedule = ${examScheduleJSON};

      function createCountdownElement(exam) {
        const container = document.createElement('div');
        container.className = 'timer';
        const title = document.createElement('div');
        title.className = 'exam-title';
        title.innerText = exam.name;
        container.appendChild(title);
        const status = document.createElement('div');
        status.className = 'countdown';
        container.appendChild(status);
        return { container, status };
      }

      function updateCountdown(exam, countdownElement) {
        const now = new Date();
        const startDate = new Date(exam.start);
        const endDate = new Date(exam.end);
        if (now < startDate) {
          const timeLeft = startDate - now;
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          let countdownText = '';
          if (days > 0) countdownText += \`\${days}d \`;
          if (hours > 0 || days > 0) countdownText += \`\${hours}h \`;
          if (minutes > 0 || hours > 0 || days > 0) countdownText += \`\${minutes}m \`;
          countdownText += \`\${seconds}s\`;
          countdownElement.innerText = \`Starts in \${countdownText.trim()}\`;
          countdownElement.style.color = getCountdownColor(days, hours, minutes, seconds);
        } else if (now >= startDate && now <= endDate) {
          countdownElement.innerText = 'Ongoing';
          countdownElement.className = 'countdown ongoing';
        } else {
          countdownElement.parentElement.classList.add('hidden');
        }
      }

      function getCountdownColor(days, hours, minutes, seconds) {
        if (days >= 365) return '#8A2BE2';
        if (days >= 30) return '#4B0082';
        if (days >= 7) return '#0000FF';
        if (days >= 1) return '#008000';
        if (hours >= 1) return '#CCCC00';
        if (minutes >= 1) return '#FFA500';
        return '#FF0000';
      }

      function initializeTimers() {
        const container = document.getElementById('timers-container');
        const countdownElements = [];
        examSchedule.forEach(exam => {
          const { container: timerContainer, status } = createCountdownElement(exam);
          container.appendChild(timerContainer);
          countdownElements.push({ exam, status });
        });
        countdownElements.forEach(({ exam, status }) => updateCountdown(exam, status));
        setInterval(() => {
          countdownElements.forEach(({ exam, status }) => updateCountdown(exam, status));
        }, 1000);
      }

      window.onload = initializeTimers;
    </script>
  </body>
  </html>
  `;
  
  for(let app of applist){
    if(app.name === "Timers"){
      app.htmlContent = timerContent;
    }
  }
  
  const appsContainer = document.getElementById('others');

  appsContainer.style.display = 'flex';
  appsContainer.style.flexWrap = 'wrap';
  appsContainer.style.gap = '25px';
  appsContainer.style.padding = '25px';
  appsContainer.style.width = '100%';
  appsContainer.style.boxSizing = 'border-box';
  appsContainer.style.backgroundColor = '#f8fafc';
  appsContainer.style.borderRadius = '12px';
  appsContainer.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
  appsContainer.style.justifyContent = 'center';
  appsContainer.style.alignItems = 'flex-start';

  appsContainer.innerHTML = '';

  applist.forEach(app => {
    const appItem = document.createElement('div');
    appItem.style.display = 'flex';
    appItem.style.flexDirection = 'column';
    appItem.style.alignItems = 'center';
    appItem.style.flex = '1 1 calc(20% - 25px)';
    appItem.style.minWidth = '180px';
    appItem.style.maxWidth = '220px';
    appItem.style.height = '220px';
    appItem.style.background = 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';
    appItem.style.borderRadius = '16px';
    appItem.style.overflow = 'hidden';
    appItem.style.border = '1px solid #e5e7eb';
    appItem.style.cursor = 'pointer';
    appItem.style.transition = 'all 0.3s ease';
    appItem.style.boxSizing = 'border-box';
    appItem.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)';
    appItem.style.position = 'relative';
    
    appItem.style.borderTop = '4px solid #3b82f6';

    appItem.onmouseover = () => {
      appItem.style.transform = 'translateY(-8px) scale(1.02)';
      appItem.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)';
    };
    appItem.onmouseout = () => {
      appItem.style.transform = 'translateY(0) scale(1)';
      appItem.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)';
    };

    appItem.onclick = () => {
      if(app.name == "Timers"){
        const blob = new Blob([timerContent], { type: 'text/html' });

        const url = URL.createObjectURL(blob);

        window.open(url, '_blank');
      }
      else if (app.htmlContent) {
        fetch(app.htmlContent)
        .then(response => response.text())
        .then(htmlContent => {
          const blob = new Blob([htmlContent], { type: 'text/html' });

          const url = URL.createObjectURL(blob);

          window.open(url, '_blank');

          setTimeout(() => URL.revokeObjectURL(url), 10000);
        })
        .catch(error => {
          console.error('Error opening HTML file:', error);
        });
      } else if (app.openInNewWindow) {
        window.open(app.url, '_blank');
      }
    };

    const imgContainer = document.createElement('div');
    imgContainer.style.width = '100%';
    imgContainer.style.height = '140px';
    imgContainer.style.overflow = 'hidden';
    imgContainer.style.display = 'flex';
    imgContainer.style.alignItems = 'center';
    imgContainer.style.justifyContent = 'center';
    imgContainer.style.background = '#f3f4f6';

    const img = document.createElement('img');
    img.src = app.thumbnail;
    img.alt = app.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.boxSizing = 'border-box';
    img.style.transition = 'transform 0.3s ease';

    appItem.onmouseover = () => {
      appItem.style.transform = 'translateY(-8px) scale(1.02)';
      appItem.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)';
      img.style.transform = 'scale(1.1)';
    };
    appItem.onmouseout = () => {
      appItem.style.transform = 'translateY(0) scale(1)';
      appItem.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)';
      img.style.transform = 'scale(1)';
    };

    imgContainer.appendChild(img);

    const name = document.createElement('div');
    name.textContent = app.name;
    name.style.width = '100%';
    name.style.padding = '15px 10px';
    name.style.background = '#ffffff';
    name.style.color = '#1f2937';
    name.style.textAlign = 'center';
    name.style.margin = '0';
    name.style.fontSize = '16px';
    name.style.fontWeight = '600';
    name.style.boxSizing = 'border-box';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';
    name.style.whiteSpace = 'nowrap';

    appItem.appendChild(imgContainer);
    appItem.appendChild(name);

    appsContainer.appendChild(appItem);
  });
}