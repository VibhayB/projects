const games = [
    { 
        name: "Bouncing Ball", 
        url: "", 
        thumbnail: "https://w7.pngwing.com/pngs/731/1016/png-transparent-crazy-bouncing-ball-game-app-store-bouncy-balls-others-game-sphere-jump-thumbnail.png", 
        openInNewWindow: false, 
        htmlContent: "htmlfiles/ball balancer.html" 
    },
    { 
        name: "Pomodoro", 
        url: "", 
        thumbnail: "https://st4.depositphotos.com/37073554/38209/v/450/depositphotos_382092468-stock-illustration-kitchen-timer-form-red-tomato.jpg", 
        openInNewWindow: false, 
        htmlContent: "htmlfiles/pomodoro.html" 
    },
    { 
        name: "Snake", 
        url: "", 
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMJHVz4Ytq3Uxj1AATP9I0jLizBzZHZX-1tg&s", 
        openInNewWindow: false, 
        htmlContent: "htmlfiles/snake.html" 
    },
    { 
        name: "2048", 
        url: "", 
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/2048_logo.svg/800px-2048_logo.svg.png", 
        openInNewWindow: false, 
        htmlContent: "htmlfiles/2048.html" 
    },
    { 
        name: "MineSweeper", 
        url: "", 
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZTutjb5iTEx5ePulQ7Z0dXLyZZKvEVO2jTQ&s", 
        openInNewWindow: false, 
        htmlContent: "htmlfiles/minesweeper.html" 
    },
    { 
        name: "Plane Defense", 
        url: "https://vibhayb.github.io/Plane-Defense/", 
        thumbnail: "https://firebasestorage.googleapis.com/v0/b/aiml-studyconnect.appspot.com/o/images%2FOIG2.TU754WuobyvyHpwCC%20(1).png?alt=media&token=4be3c85a-2127-4045-8a32-dd326dcd50c6", 
        openInNewWindow: true, 
        htmlContent: null 
    },
    { 
        name: "OverNight Assignment", 
        url: "https://drive.google.com/file/d/1SCK7GQ0eaj9ecpNnLMRo_2qxkn9sgYK5/view?usp=sharing", 
        thumbnail: "https://firebasestorage.googleapis.com/v0/b/aiml-studyconnect.appspot.com/o/images%2FPicture1.png?alt=media&token=0bf2766a-54d1-4fcd-835b-a71cd2468c79", 
        openInNewWindow: true, 
        htmlContent: null 
    }
]; 

function populateGames() {
    const appsContainer = document.getElementById('games');
    appsContainer.style.display = 'flex';
    appsContainer.style.flexWrap = 'wrap';
    appsContainer.style.justifyContent = 'center';
    appsContainer.style.alignItems = 'flex-start';
    appsContainer.style.gap = '25px';
    appsContainer.style.padding = '25px';
    appsContainer.style.width = '100%';
    appsContainer.style.boxSizing = 'border-box';
    appsContainer.style.backgroundColor = '#f8fafc';
    appsContainer.style.borderRadius = '12px';
    appsContainer.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
    appsContainer.innerHTML = '';

    games.forEach(game => {
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
            if (game.htmlContent) {
                fetch(game.htmlContent)
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
            } else if (game.openInNewWindow) {
                window.open(game.url, '_blank');
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
        img.src = game.thumbnail;
        img.alt = game.name;
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
        name.textContent = game.name;
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
