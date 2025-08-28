let player;

function onYouTubeIframeAPIReady() {
}

function populateGuide(videoId) {
    const guideContainer = document.getElementById('guide');
    guideContainer.innerHTML = '';
    guideContainer.style.background = 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)';
    guideContainer.style.borderRadius = '12px';
    guideContainer.style.padding = '25px';
    guideContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    guideContainer.style.width = '100%';
    guideContainer.style.maxWidth = '1200px';
    guideContainer.style.margin = '0 auto';

    const contentContainer = document.createElement('div');
    contentContainer.style.display = 'flex';
    contentContainer.style.flexWrap = 'wrap';
    contentContainer.style.justifyContent = 'center';
    contentContainer.style.gap = '40px';
    contentContainer.style.width = '100%';
    contentContainer.style.alignItems = 'flex-wrap';

    guideContainer.appendChild(contentContainer);

    const videoContainer = document.createElement('div');
    videoContainer.style.flex = '1';
    videoContainer.style.minWidth = '560px';
    videoContainer.style.maxWidth = '800px';
    videoContainer.style.display = 'flex';
    videoContainer.style.flexDirection = 'column';
    videoContainer.style.alignItems = 'center';

    contentContainer.appendChild(videoContainer);

    const title = document.createElement('h2');
    title.textContent = 'AIML StudyConnect Guide';
    title.style.color = '#fff';
    title.style.fontSize = '32px';
    title.style.fontWeight = '600';
    title.style.textAlign = 'center';
    title.style.textShadow = '0 2px 4px rgba(255, 255, 255, 0.3)';
    title.style.width = '100%';
    title.style.marginTop = '5vh';
    title.style.marginBottom = '5vh';

    videoContainer.appendChild(title);

    const video = document.createElement('iframe');
    video.id = 'youtube-player';
    video.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    video.allowFullscreen = true;
    video.style.width = '100%';
    video.style.aspectRatio = '16/9';
    video.style.border = 'none';
    video.style.borderRadius = '8px';
    video.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
    video.style.maxWidth = '640px';

    videoContainer.appendChild(video);

    player = new YT.Player('youtube-player', {
        events: {
            'onReady': onPlayerReady
        }
    });

    const timestampsContainer = document.createElement('div');
    timestampsContainer.style.flex = '0 0 auto';
    timestampsContainer.style.width = '400px';

    contentContainer.appendChild(timestampsContainer);

    const durationList = document.createElement('ul');
    durationList.style.listStyleType = 'none';
    durationList.style.padding = '0';
    durationList.style.margin = '0';
    durationList.style.width = '100%';
    durationList.style.background = 'rgba(0, 0, 0, 0.2)';
    durationList.style.borderRadius = '8px';
    durationList.style.overflow = 'hidden';

    timestampsContainer.appendChild(durationList);

    const videoSections = [
        { title: 'Opening the website', duration: 0 },
        { title: 'Home page', duration: 30 },
        { title: 'Course Content', duration: 54 },
        { title: 'Exams-specific content, PYQs, Datesheets and Results', duration: 107 },
        { title: 'News, Announcements and Assignments', duration: 165 },
        { title: 'ABC Ids, NPTEL choices, Academic Calendars', duration: 211 },
        { title: 'Quiz, Compiler, Chatbot', duration: 228 },
        { title: 'Phone numbers and Mails of Faculty', duration: 286 },
        { title: 'Calendar including festival, academic dates, etc.', duration: 293 },
        { title: 'Bunch of online sites, student-specific', duration: 309 },
        { title: 'Link to Installers', duration: 335 },
        { title: 'Games made using HTML, like Snake, Bouncing Ball, 2048, Plane Defense', duration: 343 },
        { title: 'SGPA, CGPA, CLASS-NEED Calculator and other content', duration: 354 },
        { title: 'Chatbot StudyBuddy', duration: 418 }
    ];

    videoSections.forEach((section, index) => {
        const listItem = document.createElement('li');
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';
        listItem.style.padding = '10px 15px';
        listItem.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        listItem.style.transition = 'all 0.3s ease';

        if (index % 2 === 0) {
            listItem.style.background = 'rgba(255, 255, 255, 0.05)';
        } else {
            listItem.style.background = 'rgba(0, 0, 0, 0.1)';
        }

        listItem.onmouseover = () => {
            listItem.style.background = 'rgba(255, 255, 255, 0.15)';
        };

        listItem.onmouseout = () => {
            if (index % 2 === 0) {
                listItem.style.background = 'rgba(255, 255, 255, 0.05)';
            } else {
                listItem.style.background = 'rgba(0, 0, 0, 0.1)';
            }
        };

        const title = document.createElement('span');
        title.textContent = section.title;
        title.style.flex = '1';
        title.style.color = '#fff';
        title.style.fontSize = '14px';
        title.style.marginRight = '10px';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
        title.style.whiteSpace = 'nowrap';

        const duration = document.createElement('span');
        const minutes = Math.floor(section.duration / 60);
        const seconds = section.duration % 60;

        duration.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        duration.style.cursor = 'pointer';
        duration.style.color = '#4fc3f7';
        duration.style.fontWeight = '600';
        duration.style.padding = '5px 10px';
        duration.style.background = 'rgba(0, 0, 0, 0.3)';
        duration.style.borderRadius = '12px';
        duration.style.transition = 'all 0.2s ease';
        duration.style.fontSize = '12px';
        duration.style.flexShrink = '0';

        duration.onmouseover = () => {
            duration.style.background = 'rgba(79, 195, 247, 0.2)';
        };

        duration.onmouseout = () => {
            duration.style.background = 'rgba(0, 0, 0, 0.3)';
        };

        duration.onclick = () => {
            seekTo(section.duration);
            duration.style.background = '#4fc3f7';
            duration.style.color = '#01579b';
            setTimeout(() => {
                duration.style.background = 'rgba(0, 0, 0, 0.3)';
                duration.style.color = '#4fc3f7';
            }, 300);
        };
        
        listItem.appendChild(title);
        listItem.appendChild(duration);
        durationList.appendChild(listItem);
    });
}

function seekTo(seconds) {
    if (player) {
        player.seekTo(seconds, true);
        player.playVideo();
    }
}

function onPlayerReady(event) {
    console.log("Player is ready");
}