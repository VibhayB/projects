function createTabs(abcData) {
    var tabsData = [
        {
            name: "Primary",
            contentFunction: () => createSpecialSection(abcData[4].data)
        },
        {
            name: "Previous Papers",
            contentFunction: () => createCards(abcData[0].data)
        },
        {
            name: "Datesheets",
            contentFunction: () => createCards(abcData[1].data)
        },
        {
            name: "Results",
            contentFunction: () => createCards(abcData[2].data)
        }
    ];

    function createSpecialSection(specialData) {
        if (!specialData) return "No Exams there<br><br>Note: The study videos here may miss or cover an extra topic, so it is advised to have a look over the syllabus and notes as well.";
        
        let content = '<div class="special-section">Note: The study videos here may miss or cover an extra topic, so it is advised to have a look over the syllabus and notes as well.<br><br>';
        
        if (specialData.timer && specialData.timer.length > 0) {
            content += `
                <div id="timers-container">
                    ${specialData.timer.map(timer => `
                        <div id="timer-${timer.name}" class="timer">
                            <div class="exam-title">${timer.name}</div>
                            <div id="countdown-${timer.name}" class="countdown"></div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (specialData.mainimages && specialData.mainimages.length > 0) {
            content += '<div class="main-images">';
            specialData.mainimages.forEach(imageGroup => {
                Object.entries(imageGroup).forEach(([imageName, imageUrl]) => {
                    content += `
                        <div class="main-image-container">
                            <h1 class="image-title">${imageName}</h1>
                            <img src="${imageUrl}" alt="${imageName}" class="main-image"/>
                        </div>`;
                });
            });
            content += '</div>';
        }
        
        if (specialData.subjects && specialData.subjects.length > 0) {
            specialData.subjects.forEach(subjectGroup => {
                Object.entries(subjectGroup).forEach(([subjectName, subjectData]) => {
                    const syllabus = (subjectData.syllabus || 'No syllabus available').replace(/\\n/g, '<br>');
                    const topics = (subjectData.topics || 'No Important topics are specified').replace(/\\n/g, '<br>');
            
                    content += `
                        <div class="subject-container">
                            <h1 class="subject-title">${subjectName}</h1>
                            <div class="subject-section">
                                <h2 class="section-title">Syllabus:</h2>
                                <p class="section-content">${syllabus}</p>
                            </div>
                            <div class="subject-section">
                                <h2 class="section-title">Important Topics:</h2>
                                <p class="section-content">${topics}</p>
                            </div>
                            <div class="subject-section">
                                <h2 class="section-title">Study Material:</h2>
                                <div class="drive-container">
                                    <iframe src="https://drive.google.com/embeddedfolderview?id=${subjectData.studyMaterial}#grid" 
                                        class="drive-iframe" 
                                        allowfullscreen>
                                    </iframe>
                                </div>
                            </div>
                            <div class="subject-section">
                                <h2 class="section-title">Videos:</h2>`;
                    
                    if (subjectData.videos && Object.keys(subjectData.videos).length > 0) {
                        content += '<div class="videos">';
                        Object.entries(subjectData.videos).forEach(([videoName, videoUrl]) => {
                            content += `
                                <div class="video-container">
                                    <p class="video-title">${videoName}</p>
                                    <div class="video-wrapper">
                                        <iframe 
                                            src="${videoUrl}" 
                                            frameborder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowfullscreen
                                            class="video-iframe"
                                        ></iframe>
                                    </div>
                                </div>`;
                        });
                        content += '</div>';
                    } else {
                        content += '<p class="no-content">No videos available</p>';
                    }
                    content += '</div></div>';
                });
            });
        }
        
        content += '</div>';
        return content;
    }
    
    function createCards(cards) {
        if (!cards) return "<div class='no-data'>No data available</div>";

        return cards.map(card => `
            <a href="${card.link}" target="_blank" class="card-link">
                <div class="card">
                    ${card.text}
                </div>
            </a>
        `).join('');
    }

    const examsContainer = document.getElementById('exams');
    examsContainer.innerHTML = "";

    const tabsContainer = document.createElement('div');
    tabsContainer.id = 'tabs';
    tabsContainer.className = 'tabs-container';

    const contentContainer = document.createElement('div');
    contentContainer.id = 'tab-contents';
    contentContainer.className = 'tab-contents';

    tabsData.forEach((tab, index) => {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.textContent = tab.name;
        tabElement.dataset.contentId = `content-${index}`;
        
        const contentElement = document.createElement('div');
        contentElement.id = `content-${index}`;
        contentElement.className = 'tab-content';

        contentContainer.appendChild(contentElement);
        tabsContainer.appendChild(tabElement);
    });

    examsContainer.appendChild(tabsContainer);
    examsContainer.appendChild(contentContainer);

    function updateContent(contentId, contentFunction) {
        const contentElement = document.getElementById(contentId);
        contentElement.innerHTML = contentFunction();
        contentElement.style.display = 'block';
        
        const timersContainer = document.getElementById('timers-container');
        if (timersContainer && abcData[4].data.timer) {
            abcData[4].data.timer.forEach(timer => {
                const countdownElement = document.getElementById(`countdown-${timer.name}`);
                if (countdownElement) {
                    const startTime = new Date(timer.start).getTime();
                    const endTime = new Date(timer.end).getTime();
                    
                    function updateCountdown() {
                        const now = new Date().getTime();
                        
                        if (now < startTime) {
                            const distance = startTime - now;
                            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                            let countdownText = '';
                            if (days > 0) countdownText += `${days}d `;
                            if (hours > 0 || days > 0) countdownText += `${hours}h `;
                            if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `;
                            countdownText += `${seconds}s`;

                            countdownElement.textContent = `Starts in ${countdownText.trim()}`;
                            countdownElement.style.color = getCountdownColor(days, hours, minutes, seconds);
                            countdownElement.className = 'countdown not-started';
                        } else if (now >= startTime && now <= endTime) {
                            countdownElement.textContent = 'Ongoing';
                            countdownElement.className = 'countdown ongoing';
                        } else {
                            countdownElement.textContent = '';
                            countdownElement.className = 'countdown hidden';
                        }
                    }
                    updateCountdown();
                    setInterval(updateCountdown, 1000);
                }
            });
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

    const firstTab = tabsContainer.querySelector('.tab');
    const firstContent = contentContainer.querySelector('.tab-content');
    firstTab.classList.add('active');
    updateContent(firstContent.id, tabsData[0].contentFunction);

    tabsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('tab')) {
            const contentId = event.target.dataset.contentId;
            const index = Array.from(tabsContainer.children).indexOf(event.target);
            const contentFunction = tabsData[index].contentFunction;

            tabsContainer.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            contentContainer.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });

            event.target.classList.add('active');
            updateContent(contentId, contentFunction);
        }
    });

    examsContainer.style.display = "block";

    const style = document.createElement('style');
    style.textContent = `
        .tabs-container {
            display: flex;
            flex-wrap: wrap;
            border-bottom: 2px solid #e0e0e0;
            background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
            border-radius: 12px 12px 0 0;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            margin-bottom: 0;
        }
        
        .tab {
            cursor: pointer;
            padding: 16px 24px;
            margin-right: 4px;
            transition: all 0.3s ease;
            border-radius: 8px 8px 0 0;
            background: transparent;
            color: #555;
            font-weight: 600;
            font-size: 16px;
            position: relative;
            overflow: hidden;
            flex: 1;
            text-align: center;
            min-width: 120px;
        }
        
        .tab:hover {
            background: rgba(0, 123, 255, 0.1);
            color: #007bff;
        }
        
        .tab.active {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }
        
        .tab.active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 3px;
            background: #007bff;
        }
        
        .tab-contents {
            padding: 30px;
            overflow-y: auto;
            background: white;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            min-height: 500px;
        }
        
        .tab-content {
            display: none;
        }
        
        .special-section {
            line-height: 1.6;
            color: #444;
        }
        
        #timers-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        
        .timer {
            font-size: 20px;
            font-weight: bold;
            padding: 20px;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 12px;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
            width: 280px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 160px;
            border-left: 4px solid #007bff;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .timer:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
        }
        
        .exam-title {
            font-size: 22px;
            margin-bottom: 12px;
            color: #333;
            font-weight: 700;
        }
        
        .countdown {
            font-size: 18px;
            font-weight: normal;
            margin-top: 10px;
        }
        
        .ongoing {
            color: #28a745;
            font-weight: bold;
        }
        
        .not-started {
            font-weight: bold;
        }
        
        .hidden {
            display: none;
        }
        
        .main-image-container {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .image-title {
            font-size: 32px;
            font-weight: 800;
            color: #2d3748;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #007bff, #0056b3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }
        
        .main-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s ease;
        }
        
        .main-image:hover {
            transform: scale(1.02);
        }
        
        .subject-container {
            margin: 40px 0;
            padding: 25px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #007bff;
        }
        
        .subject-title {
            font-size: 32px;
            font-weight: 800;
            color: #2d3748;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eaeaea;
            background: linear-gradient(135deg, #007bff, #0056b3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subject-section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 22px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 12px;
            padding-left: 10px;
            border-left: 4px solid #007bff;
        }
        
        .section-content {
            font-size: 17px;
            line-height: 1.7;
            color: #4a5568;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 3px solid #007bff;
        }
        
        .drive-container {
            position: relative;
            padding-bottom: 60%;
            height: 0;
            overflow: hidden;
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            background: linear-gradient(135deg, #f0f8ff, #e6e6fa);
        }
        
        .drive-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 10px;
        }
        
        .video-container {
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .video-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .video-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
            border-radius: 8px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .video-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .no-content {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 20px;
        }
        
        .card-link {
            display: block;
            text-decoration: none;
            color: inherit;
            margin: 10px 0;
            transition: transform 0.3s ease;
        }
        
        .card-link:hover {
            transform: translateY(-3px);
        }
        
        .card {
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            padding: 20px;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            font-size: 16px;
            font-weight: 500;
            color: #2d3748;
            border-left: 4px solid #007bff;
        }
        
        .card:hover {
            box-shadow: 0 8px 16px rgba(0, 123, 255, 0.2);
            border-left: 4px solid #0056b3;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-style: italic;
        }
        
        @media only screen and (max-width: 768px) {
            .tabs-container {
                flex-direction: column;
            }
            
            .tab {
                border-radius: 0;
                margin-right: 0;
                margin-bottom: 4px;
            }
            
            .tab.active {
                border-radius: 8px;
            }
            
            #timers-container {
                flex-direction: column;
                align-items: center;
            }
            
            .timer {
                width: 100%;
                max-width: 280px;
            }
            
            .tab-contents {
                padding: 20px;
            }
            
            .subject-container {
                padding: 15px;
            }
            
            .subject-title {
                font-size: 26px;
            }
        }
    `;
    document.head.appendChild(style);
}