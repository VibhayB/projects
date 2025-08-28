// script.js
let thisversion = "v1.5"
let isSignedIn = false;
let currentDate = new Date();
var maindata = null;
let readability = true;
var assignmentclick = false;
var tagfilterapplier = null;
let fadeTimeout;
var otheritems = [];
var feedbackurl;
var reporturl;
var imageMap;
var courseData;
var showbanner = "show"; //set to 'dont show' to disable and 'show' to enable
const classLists = {"course":"Course","feed":"Feed","exams":"Exams","games":"Games","calendar":"Academic Calendar","forms":"Important Docs","contacts":"Important Contacts","installers":"Installers","sites":"Online Sites","others":"Others","productivity":"Productivity","guide":"Guide"};

// Tab names mapped to firebase document name
const tabNames = {
    "courseData": "course",
    "posts": "feed",
    "forms": "forms",
    "examData": "exams",
    "apps": "others",
    "examSchedule": "calendar",
    "onlineSites": "sites",
    "contacts": "contacts",
    "installers": "installers",
    "games" : "games",
    "productivity": "productivity",
    "home": "home",
    "guide": "guide"
};

// Keywords for chatbot
const keywords = {
    "courseData": ["course", "study material", "course content"],
    "posts": ["posts", "feed"],
    "forms": ["docs", "sheets","important docs","forms"],
    "examData": ["examData"],
    "apps": ["apps", "others"],
    "examSchedule": ["examSchedule", "timers", "calendar", "date", "dates"],
    "onlineSites": ["onlineSites", "sites", "websites"],
    "contacts": ["contacts", "call", "email"],
    "installers": ["installers", "install", "download"],
    "games" : ["games","fun","game"],
    "productivity": ["productivity","chatpdf","blackbox","quiz","compiler"],
    "home":["home","AIML StudyConnect"],
    "guide": ["guide","demo","help"]
};


function showLoadingScreen() {
    document.getElementById("screen").style.display = 'none';
    document.getElementById("banner").style.display = 'none';
    document.getElementById("sign-in-message").style.display = 'none';
    
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.zIndex = '1004';
    loadingScreen.style.color = 'white';
    loadingScreen.style.flexDirection = 'column';

    const loader = document.createElement('div');
    loader.style.border = '16px solid #f3f3f3';
    loader.style.borderTop = '16px solid #3498db';
    loader.style.borderRadius = '50%';
    loader.style.width = '120px';
    loader.style.height = '120px';
    loader.style.animation = 'spin 2s linear infinite';

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Loading, please wait...';
    loadingText.style.marginTop = '20px';
    loadingText.style.color = 'black';  

    loadingScreen.appendChild(loader);
    loadingScreen.appendChild(loadingText);
    document.body.appendChild(loadingScreen);

    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `, styleSheet.cssRules.length);
}

function hideLoadingScreen() {
    document.getElementById("screen").style.display = '';
    document.getElementById("banner").style.display = '';
    if(!isSignedIn){
        document.getElementById("sign-in-message").style.display = '';
    } else{
        document.getElementById("sign-in-message").style.display = 'none';
    }
    
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 1s';

        setTimeout(() => {
            if (loadingScreen && loadingScreen.parentNode) {
                loadingScreen.parentNode.removeChild(loadingScreen);
            }
        }, 1000);
    }
}


function updateStatusBar() {
    const statusBar = document.getElementById('status-bar');

    if (navigator.onLine) {
        statusBar.textContent = 'You are back online';
        statusBar.className = 'online';
        statusBar.style.display = 'block'; 
        statusBar.style.opacity = '1'; 
        
        clearTimeout(fadeTimeout);
        fadeTimeout = setTimeout(() => {
            statusBar.style.opacity = '0'; 
            setTimeout(() => {
                statusBar.style.display = 'none'; 
            }, 500);
        }, 2000); 
    } else {
        statusBar.textContent = 'You are offline';
        statusBar.className = 'offline';
        statusBar.style.display = 'block';
        statusBar.style.opacity = '1';
    }
}

window.addEventListener('online', updateStatusBar);
window.addEventListener('offline', updateStatusBar);

function userRead() {
    if (readability) {
        readability = false;
        console.log("Loading started");
        setTimeout(() => {
            readability = true;
            console.log("Free to load again");
        }, 2000);
    }
}

var currenttab = localStorage.getItem("tabcurrentx");
var currentheader = localStorage.getItem("tabcurrenty");
var examSchedule;
var applist;


async function fetchAndDisplayData() {
    try {
      const lastlogStr = localStorage.getItem("lastlog");
      const lastlog = lastlogStr ? new Date(parseInt(lastlogStr, 10)) : null;
      
    console.log(".....")
      
    const currentTime = new Date();
    let abctime = localStorage.getItem("tries") || "2024-09-28T00:00:00";
    let abctimeParsed = new Date(abctime).getTime(); 
    
    console.log("......")
    if (Date.now() - abctimeParsed > 5000) {
        try {
            const data = await window.loadCollectionData('categoriesData'); 
            maindata = data;
        } catch (error) {
            console.error('Error loading data:', error);
            maindata = null;
        }
    } else {
        maindata = null;
    } 
    console.log(".......")
    localStorage.setItem("tries", new Date().toISOString());
    console.log('Website Loaded');
      const storedData = JSON.parse(localStorage.getItem("maindataxh"));
      if((!maindata || !maindata.some(item => item.id === 'courseData'))){
        if(storedData){
            maindata = storedData;
        } else{
            console.log("Unauthorized");
            localStorage.removeItem("efusereId");
            signInWithGoogleDirectly(true);               
            localStorage.setItem("tabcurrentx","home");
            localStorage.setItem("tabcurrenty","AIML StudyConnect");        
            showAlert("You don't have access","https://cdn-icons-png.flaticon.com/512/675/675564.png");
            readability = false;
            return;
        }
      } 
      
    console.log("........")
      if(!isSignedIn){
        localStorage.setItem("maindataxh", JSON.stringify(maindata));
        if(!lastlog){
            showAlert("Signed in successfully, as "+localStorage.getItem("efusereId"),"https://www.freeiconspng.com/thumbs/success-icon/success-icon-2.png");
            showbanner = "show later";
        } else if(Date.now() - lastlog > 600000){
            showbanner = "show already";
            currenttab = "home";
        }
        console.log("Displaying");
        isSignedIn = true;
        let fxc = [null,null];
        for(let data of maindata){
            if(data.id == "examData"){
                createTabs(data.data);
            } else if(data.id == "contacts"){
                populateContacts(data.data);
            } else if(data.id == "installers"){
                populateInstallers(data.data);
            } else if(data.id == "onlineSites"){
                populateOnlineSites(data.data);
            } else if(data.id == "forms"){
                populateForms(data.data);
            } else if(data.id == "examSchedule"){
                examSchedule = data.data;
                generateCalendar();
            } else if(data.id == "apps"){
                applist = data.data;
            } else if(data.id == "posts"){
                populateFeed(data.data,lastlog);
            } else if(data.id == "courseData"){
                courseData = data.data;
            } else if(data.id == "Others"){
                otheritems.push(data.infoSection);
                feedbackurl = data.URLs.feedback;
                reporturl = data.URLs.report;
                localStorage.setItem("xebiacontent",JSON.stringify(data["Xebia Content"]));
                localStorage.setItem('clanlinks',JSON.stringify(data["ClanLinks"]));
                let courseInfo = data["courseInfo"];
                localStorage.setItem("courseInfo", JSON.stringify(courseInfo));
                localStorage.setItem("semesters",JSON.stringify(data.semesters));
                imageMap = data.Images;
                fxc[1] = data.fxd;
                populateGuide(data["guide_video"])
            } else if(data.id =="productivity"){
                fxc[0] = data.data;
            }
        }
        populateProductivity(fxc[0],fxc[1]);
        populateApps();
        populateGames();
        injectCSS();
        initializeSemesterSelection();
        showHome();
        updateHomeButton();
        
    console.log(".........")
        if(currenttab){
            document.querySelector("#header").innerHTML = currentheader;
            showTab(event, currenttab);
        }  readability = false;
      } 
    } catch (error) {
      console.error('Error loading', error);
      showAlert("Unable to sync data, please try again","https://cdn-icons-png.flaticon.com/512/675/675564.png");
    } finally{
        
    console.log("..........")
        hideLoadingScreen();
    }
};
  
const signInMessage = document.createElement('div');
signInMessage.id = 'sign-in-message';
signInMessage.className = 'sign-in-message';
signInMessage.textContent = 'Sign in to access content';

signInMessage.style.position = 'fixed';
signInMessage.style.bottom = '0';
signInMessage.style.left = '0'; 
signInMessage.style.width = '100%'; 
signInMessage.style.height = 'auto';
signInMessage.style.backgroundColor = 'black';
signInMessage.style.color = 'white';
signInMessage.style.borderTop = '1px solid #f5c6cb'; 
signInMessage.style.borderRadius = '8px 8px 0 0'; 
signInMessage.style.padding = '15px'; 
signInMessage.style.boxShadow = '0 -2px 4px rgba(0, 0, 0, 0.1)'; 
signInMessage.style.zIndex = '999';
signInMessage.style.textAlign = 'center';
signInMessage.style.fontFamily = 'Arial, sans-serif';

document.body.appendChild(signInMessage);

const homeContent = document.getElementById('home');

function showAlert(message,icon="load.png") {
    closeAlert();
    document.getElementById("alertimg").src=icon;
    document.querySelector('.alert-message').innerHTML = message;

    const alertBox = document.getElementById('custom-alert');
    alertBox.style.display = 'block';
    
    requestAnimationFrame(() => {
        alertBox.style.opacity = '1';
        alertBox.style.visibility = 'visible';
    });
  }
  
  function closeAlert() {
    const alertBox = document.getElementById('custom-alert');

    alertBox.style.opacity = '0';
    alertBox.style.visibility = 'hidden';
    if(showbanner == "show later"){
        try{
            document.getElementById('initialbanner').style.display = "flex";
        } catch(error){

        }
        showbanner = "dont show"; 
    }
  }

function toggleMenu() {
    const nav = document.getElementById('hamburger-menu');
    const overlay = document.getElementById('overlay');
    const main = document.querySelector('main');
    const menuItems = nav.querySelectorAll('ul li');

    nav.classList.toggle('closed');
    overlay.classList.toggle('open');
    overlay.classList.toggle('closed');
    main.classList.toggle('dimmed');

    if (!nav.classList.contains('closed')) {
        menuItems.forEach((item, index) => {
            item.style.animation = `fadeInSlideRight 0.5s forwards ${index * 0.1}s`;
        });
    } else {
        menuItems.forEach((item) => {
            item.style.animation = '';
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
        });
    }
}


function showTab(event, tabName, pushToHistory = true) {  
    if(tabName == "assignments"){
        tabName = 'feed';
        console.log(tagfilterapplier);
    }
    const logo = document.querySelector("#header");
    const currentState = history.state;
    try{
        if (pushToHistory) {
            if (!currentState || currentState.tab !== tabName) {
                history.pushState({ tab: tabName }, null, `#${tabName}`);
            }
        } 
        if(tabName == "home"){
            showHome();
            localStorage.setItem("tabcurrentx","home");
            localStorage.setItem("tabcurrenty","AIML StudyConnect");
            return "Home showing";
        } localStorage.setItem("tabcurrentx", tabName);
        
        document.getElementById("home").style.display = 'none';
        try{
            event.preventDefault(); 
        } catch(error){
        }
        const content = document.getElementsByClassName("content");
        for (let i = 0; i < content.length; i++) {
            content[i].style.display = "none";
        }
        const menuItems = document.querySelectorAll("nav ul li");
        for (let i = 0; i < menuItems.length; i++) {
            menuItems[i].classList.remove("active");
        } 
        if(tabName == "games" || tabName == "others" || tabName =="installers" || tabName == "sites" || tabName == "contacts" || tabName == "forms" || tabName == "feed" || tabName == "course" || tabName == "guide"){
            document.getElementById(tabName).style.display = "flex";
        }
        else{
            document.getElementById(tabName).style.display = "block";
        } 
        try{
            
            if(event.currentTarget.innerHTML == "View Post" || tabName == "feed"){
                logo.innerHTML = "Feed";
                localStorage.setItem("tabcurrenty", "Feed");
            }
            else{
                event.currentTarget.classList.add("active");
                logo.innerHTML = event.currentTarget.innerHTML;
                localStorage.setItem("tabcurrenty", event.currentTarget.innerHTML);
            } if(event.currentTarget.innerHTML == "Assignments"){
                assignmentclick = true;
                
                if(tagfilterapplier) tagfilterapplier.click(); 
                else assignmentclick = false;
                
            }
        } catch(error){
            logo.innerHTML = classLists[tabName];
            localStorage.setItem("tabcurrenty", classLists[tabName]);
        } finally{
            return "Showing tab: " + classLists[tabName];
        } 
    } catch(error){
        console.error(error);
        return "Error";
    } 
}
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.tab) {
       showTab(null,event.state.tab,false);
    }
 });
function handleHomeClick() {
    if(!isSignedIn){
        signInWithGoogleDirectly(false);
        return;
    } console.log("Already signed in");
}

function initializeScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '-50px 0px -50px 0px',
        threshold: [0.1, 0.3, 0.6]
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const element = entry.target;
            
            if (entry.isIntersecting) {
                element.classList.remove('animate-slide-left', 'animate-slide-right');
                
                const flexDirection = window.getComputedStyle(element).flexDirection;
                const isReversed = flexDirection === 'row-reverse';
                
                if (isReversed) {
                    element.classList.add('animate-slide-left');
                } else {
                    element.classList.add('animate-slide-right');
                }
                
            } else {
                element.classList.remove('animate-slide-left', 'animate-slide-right');
                element.style.opacity = '0';
                element.style.transform = 'translateX(50px)'; 
            }
        });
    }, observerOptions);

    const infoItems = document.querySelectorAll('.info-item-animate');
    infoItems.forEach((item, index) => {
        const isEven = index % 2 === 0;
        item.style.opacity = '0';
        item.style.transform = isEven ? 'translateX(-50px)' : 'translateX(50px)';
        item.style.transition = 'none';
        
        observer.observe(item);
    });
}

function addEnhancedScrollAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInSlideLeft {
            0% { 
                opacity: 0; 
                transform: translateX(50px);
            }
            100% { 
                opacity: 1; 
                transform: translateX(0);
            }
        }
        
        @keyframes fadeInSlideRight {
            0% { 
                opacity: 0; 
                transform: translateX(-50px);
            }
            100% { 
                opacity: 1; 
                transform: translateX(0);
            }
        }
        
        .animate-slide-left {
            animation: fadeInSlideLeft 0.8s ease-out forwards !important;
        }
        
        .animate-slide-right {
            animation: fadeInSlideRight 0.8s ease-out forwards !important;
        }
        
        .info-item-animate {
            transition: all 0.4s ease;
        }
        
        .info-item-animate:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15) !important;
        }
    `;
    document.head.appendChild(style);
}

function enhanceHomeScrollEffects() {
    addEnhancedScrollAnimations();
    
    setTimeout(() => {
        initializeScrollAnimations();
    }, 100);
}

function showHome() { 
function chatbotmechanism(input){
    return handleUserPrompt(input);
}
function handleUserPrompt(userPrompt) {
    const normalizedPrompt = userPrompt.toLowerCase();

    let foundTab = null;
    for (const [id, keywordsList] of Object.entries(keywords)) {
        for (const keyword of keywordsList) {
            if (normalizedPrompt.includes(keyword)) {
                foundTab = tabNames[id];
                break;
            }
        }
        if (foundTab) break;
    }
    for (let i = 0; i < intents.intents.length; i++) {
        const intent = intents.intents[i];
        for (let j = 0; j < intent.patterns.length; j++) {
            const pattern = intent.patterns[j];
            if (userPrompt.toLowerCase().includes(pattern.toLowerCase())) {
            return intent.responses[Math.floor(Math.random() * intent.responses.length)];
            }
        }
    }
    if (foundTab) {
        return showTab(null, foundTab);
    }

    return "I couldn't find exactly what you're looking for right now. I'll be updated with more information soon!";
}
function displaySearchResult(input) {
    
        let displayHTML = chatbotmechanism(input);

        displayHTML = displayHTML.replace(/(https?:\/\/[^\s<>"']{20,})/g, '<a href="$1" target="_blank" title="$1">$1</a>');

        displayHTML = displayHTML.replace("\\n", '<br>');

        displayMessage(displayHTML, 'bot');
}

    document.querySelector("#header").innerHTML = 'AIML StudyConnect';

    const content = document.getElementsByClassName("content");
    signInMessage.style.display = 'none';
    for (let i = 0; i < content.length; i++) {
        content[i].style.display = "none";
    }
    const menuItems = document.querySelectorAll("nav ul li");
    for (let i = 0; i < menuItems.length; i++) {
        menuItems[i].classList.remove("active");
    }
    const homeContent = document.getElementById('home');
    homeContent.style.display = "block";
    homeContent.style.justifyContent = 'center';
    
    const mainContainer = document.createElement('div');
    mainContainer.style.width = '100%';
    mainContainer.style.maxWidth = '1200px';
    mainContainer.style.margin = '0 auto';
    mainContainer.style.padding = '20px';
    mainContainer.style.boxSizing = 'border-box';

    if(!document.getElementById('feedback-report-buttons')){
const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'feedback-report-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexWrap = 'wrap';
    buttonsContainer.style.justifyContent = 'center';
    buttonsContainer.style.gap = '20px';
    buttonsContainer.style.margin = '40px 0';
    buttonsContainer.style.padding = '0';
    buttonsContainer.style.boxSizing = 'border-box';

const buttonData = [
        { text: 'Course', tab: 'course', icon: 'fas fa-book' },
        { text: 'Assignments', tab: 'assignments', icon: 'fas fa-tasks' },
        { text: 'Docs', tab: 'forms', icon: 'fas fa-file-alt' },
        { text: 'Exams', tab: 'exams', icon: 'fas fa-graduation-cap' },
        { text: 'Feed', tab: 'feed', icon: 'fas fa-newspaper' },
        { text: 'Others', tab: 'others', icon: 'fas fa-ellipsis-h' }
    ];

buttonData.forEach(data => {
    const button = document.createElement('button');
    button.textContent = data.text;
    button.className = 'dynamic-button';

    button.onclick = () => showTab(event, data.tab);
    buttonsContainer.appendChild(button);
});

mainContainer.appendChild(buttonsContainer);

    const timetableSection = document.createElement('div');
    timetableSection.className = 'timetable-section';
    timetableSection.style.textAlign = 'center';
    timetableSection.style.margin = '50px 0';
    timetableSection.style.padding = '30px';
    timetableSection.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    timetableSection.style.borderRadius = '16px';
    timetableSection.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';

    const heading = document.createElement('h3');
    heading.textContent = 'Timetable (AIML7A)';
    heading.style.fontSize = '1.8rem';
    heading.style.color = '#2d3748';
    heading.style.marginBottom = '25px';
    heading.style.fontWeight = '700';

const image = document.createElement('img');
    image.src = imageMap.TimeTable;
    image.alt = 'Timetable';
    image.style.width = '100%';
    image.style.maxWidth = '900px';
    image.style.height = 'auto';
    image.style.borderRadius = '12px';
    image.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    image.style.transition = 'transform 0.3s ease';
    
    image.onmouseover = () => image.style.transform = 'scale(1.02)';
    image.onmouseout = () => image.style.transform = 'scale(1)';

    timetableSection.appendChild(heading);
    timetableSection.appendChild(image);
    mainContainer.appendChild(timetableSection);

    const infoSection = document.createElement('div');
    infoSection.className = 'info-section';
    infoSection.style.margin = '60px 0';
    
    infoSection.innerHTML = `
        <div style="width: 100%; margin: 0 auto; padding: 0; background-color: transparent; box-sizing: border-box;">
            <h2 style="text-align: center; margin-bottom: 40px; font-size: 2.2rem; color: #2d3748; font-weight: 800; position: relative;">
                About This Website
                <div style="height: 5px; width: 80px; background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); margin: 20px auto; border-radius: 3px;"></div>
            </h2>
            
            <div style="display: flex; flex-direction: column; gap: 50px;">
                ${otheritems[0].map((point, index) => {
                    const isEven = index % 2 === 0;
                    return `
                    <div class="info-item-animate" style="display: flex; flex-direction: ${isEven ? 'row' : 'row-reverse'}; align-items: center; gap: 50px; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1); transition: all 0.4s ease; border: 1px solid rgba(0,0,0,0.05);" 
                         onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 15px 40px rgba(0, 0, 0, 0.15)'" 
                         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 30px rgba(0, 0, 0, 0.1)'">
                        <div style="flex: 1.2;">
                            <p style="font-size: 1.2rem; line-height: 1.8; color: #4a5568; margin: 0; font-weight: 500;">${point}</p>
                        </div>
                        <div style="flex: 1; display: flex; justify-content: center;">
                            <div style="width: 100%; max-width: 320px; height: 220px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 1.5rem; box-shadow: inset 0 4px 12px rgba(0,0,0,0.05);">
                                <i class="${getIconForIndex(index)}" style="font-size: 3.5rem; color: var(--primary-color); opacity: 0.8;"></i>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    mainContainer.appendChild(infoSection);
    const footer = document.createElement('footer');
    footer.id = 'footer';
    footer.className = isSignedIn ? '' : 'hidden';
    footer.style.marginTop = '60px';
    footer.style.padding = '30px';
    footer.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    footer.style.borderRadius = '16px';
    footer.style.textAlign = 'center';
    
    const footerButtons = document.createElement('div');
    footerButtons.style.display = 'flex';
    footerButtons.style.justifyContent = 'center';
    footerButtons.style.gap = '20px';
    footerButtons.style.marginTop = '20px';
    
    const feedbackButton = document.createElement('button');
    feedbackButton.className = 'feedback-button';
    feedbackButton.textContent = 'Feedback';
    feedbackButton.style.padding = '12px 25px';
    
    const reportButton = document.createElement('button');
    reportButton.className = 'report-button';
    reportButton.textContent = 'Report';
    reportButton.style.padding = '12px 25px';
    
    feedbackButton.onclick = () => window.open(feedbackurl, '_blank');
    reportButton.onclick = () => window.open(reporturl, '_blank');
    
    footerButtons.appendChild(feedbackButton);
    footerButtons.appendChild(reportButton);
    footer.appendChild(footerButtons);
    mainContainer.appendChild(footer);

    homeContent.appendChild(mainContainer);

    enhanceHomeScrollEffects();

}
function getIconForIndex(index) {
    const icons = [
        'fas fa-users',
        'fas fa-globe',
        'fas fa-rocket',
        'fas fa-cog',
        'fas fa-chart-line',
        'fas fa-lightbulb',
        'fas fa-mobile-alt',
        'fas fa-shield-alt'
    ];
    return icons[index % icons.length];
}
    const feedbackButton = document.querySelector('.feedback-button');
    const reportButton = document.querySelector('.report-button');

    if (feedbackButton) {
        feedbackButton.addEventListener('click', function() {
            window.open(feedbackurl, '_blank');
        });
    }
    if (reportButton) {
        reportButton.addEventListener('click', function() {
            window.open(reporturl, '_blank');
        });
    }  
if (!document.getElementById('chatbot-container')) {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-container';
    chatbotContainer.innerHTML = `
        <div id="chatbot-toggle" style="cursor: pointer; position: fixed; bottom: 20px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 50%; z-index: 1000; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
            <img src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" id="chatbot-image" style="width: 28px; height: 28px; transition: transform 0.3s ease;">
        </div>
        <div id="chatbot" style="display: none; position: fixed; bottom: 100px; right: 20px; width: 350px; height: 500px; background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: none; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); z-index: 1000; overflow: hidden; transform: scale(0.8) translateY(20px); opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px);">
            <div id="chatbot-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: left; position: relative; box-shadow: 0 2px 10px rgba(102, 126, 234, 0.2);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 10px; height: 10px; background: #4ade80; border-radius: 50%; animation: pulse 2s infinite;"></div>
                    <img src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" style="width: 24px; height: 24px;">
                    <span style="font-weight: 600; font-size: 16px;">StudyBuddy</span>
                </div>
                <span id="close-chatbot" style="position: absolute; top: 20px; right: 20px; cursor: pointer; font-size: 24px; font-weight: 300; transition: transform 0.2s ease; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; hover-bg: rgba(255,255,255,0.1);">&times;</span>
            </div>
            <div id="messages" style="padding: 20px; height: calc(100% - 140px); overflow-y: auto; background: transparent; display: flex; flex-direction: column; gap: 15px; scroll-behavior: smooth;">
                <div style="display: flex; align-items: flex-end; gap: 8px;">
                    <img src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4px;">
                    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #334155; padding: 12px 16px; border-radius: 18px 18px 18px 4px; max-width: 80%; font-size: 14px; line-height: 1.4; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        Hello! I'm StudyBuddy. How can I help you today? 🎓
                    </div>
                </div>
            </div>
            <div style="padding: 20px; border-top: 1px solid rgba(226, 232, 240, 0.5); background: rgba(248, 250, 252, 0.8); position: absolute; bottom: 0; width: calc(100% - 40px); box-sizing: border-box; backdrop-filter: blur(10px);">
                <div style="display: flex; gap: 10px; align-items: center; background: white; border-radius: 25px; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid rgba(226, 232, 240, 0.5);">
                    <input id="message-input" type="text" placeholder="Ask me anything..." style="flex: 1; padding: 12px 16px; border: none; outline: none; background: transparent; font-size: 14px; color: #334155;" />
                    <button id="send-message" style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(chatbotContainer);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        @keyframes slideInUp {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInSlideUp {
            0% { 
                opacity: 0; 
                transform: translateY(50px);
            }
            100% { 
                opacity: 1; 
                transform: translateY(0);
            }
        }
        @keyframes bounceIn {
            0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
            50% { transform: scale(1.05) rotate(-5deg); opacity: 0.8; }
            70% { transform: scale(0.9) rotate(2deg); opacity: 0.9; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        #chatbot-toggle:hover {
            transform: scale(1.1) rotate(5deg) !important;
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.6) !important;
        }
        #close-chatbot:hover {
            transform: rotate(90deg) !important;
            background: rgba(255,255,255,0.1) !important;
        }
        #send-message:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5) !important;
        }
        #send-message:active {
            transform: scale(0.95) !important;
        }
        #messages::-webkit-scrollbar {
            width: 6px;
        }
        #messages::-webkit-scrollbar-track {
            background: transparent;
        }
        #messages::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
        }
        .message-fade-in {
            animation: slideInUp 0.4s ease-out;
        }
        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
        }
        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #94a3b8;
            animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1.2); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    const chatbotToggle = document.getElementById('chatbot-toggle');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatImage = document.getElementById('chatbot-image');
    const messageInput = document.getElementById('message-input');
    const sendMessageButton = document.getElementById('send-message');
    const messagesContainer = document.getElementById('messages');

    chatImage.onclick = () => {
        const chatbot = document.getElementById('chatbot');
        if (chatbot.style.display === 'none' || !chatbot.style.display) {
            chatbot.style.display = 'block';
            setTimeout(() => {
                chatbot.style.transform = 'scale(1) translateY(0)';
                chatbot.style.opacity = '1';
            }, 10);
            messageInput.focus();
        } else {
            chatbot.style.transform = 'scale(0.8) translateY(20px)';
            chatbot.style.opacity = '0';
            setTimeout(() => {
                chatbot.style.display = 'none';
            }, 300);
        }
    };

    closeChatbot.onclick = () => {
        const chatbot = document.getElementById('chatbot');
        chatbot.style.transform = 'scale(0.8) translateY(20px)';
        chatbot.style.opacity = '0';
        setTimeout(() => {
            chatbot.style.display = 'none';
        }, 300);
    };

    function displayMessage(text, sender) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-fade-in');
        messageWrapper.style.display = 'flex';
        messageWrapper.style.alignItems = 'flex-end';
        messageWrapper.style.gap = '8px';
        messageWrapper.style.flexDirection = sender === 'user' ? 'row-reverse' : 'row';

        const messageText = document.createElement('div');
        messageText.style.maxWidth = '80%';
        messageText.style.padding = '12px 16px';
        messageText.style.borderRadius = sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
        messageText.style.fontSize = '14px';
        messageText.style.lineHeight = '1.4';
        messageText.style.wordWrap = 'break-word';
        messageText.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        messageText.style.position = 'relative';
        
        if (sender === 'user') {
            messageText.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            messageText.style.color = 'white';
        } else {
            messageText.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
            messageText.style.color = '#334155';
        }

        const icon = document.createElement('img');
        icon.src = sender === 'user'
            ? 'https://cdn-icons-png.flaticon.com/512/552/552721.png'
            : 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png';
        icon.style.width = '24px';
        icon.style.height = '24px';
        icon.style.borderRadius = '50%';
        icon.style.flexShrink = '0';
        
        if (sender !== 'user') {
            icon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            icon.style.padding = '4px';
        }
        
        messageText.innerHTML = text;
        messageWrapper.appendChild(icon);
        messageWrapper.appendChild(messageText);
        messagesContainer.appendChild(messageWrapper);
        
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
    }

    function showTypingIndicator() {
        const typingWrapper = document.createElement('div');
        typingWrapper.id = 'typing-indicator';
        typingWrapper.style.display = 'flex';
        typingWrapper.style.alignItems = 'flex-end';
        typingWrapper.style.gap = '8px';

        const icon = document.createElement('img');
        icon.src = 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png';
        icon.style.width = '24px';
        icon.style.height = '24px';
        icon.style.borderRadius = '50%';
        icon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        icon.style.padding = '4px';

        const typingBubble = document.createElement('div');
        typingBubble.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
        typingBubble.style.padding = '12px 16px';
        typingBubble.style.borderRadius = '18px 18px 18px 4px';
        typingBubble.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        typingBubble.classList.add('typing-indicator');
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.classList.add('typing-dot');
            typingBubble.appendChild(dot);
        }

        typingWrapper.appendChild(icon);
        typingWrapper.appendChild(typingBubble);
        messagesContainer.appendChild(typingWrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    sendMessageButton.onclick = () => {
        const userMessage = messageInput.value.trim();
        if (userMessage) {
            displayMessage(userMessage, 'user');
            messageInput.value = '';

            const searchTerm = userMessage.toLowerCase();

            setTimeout(() => {
                displaySearchResult(searchTerm);
            }, 700);
        }
    };

    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessageButton.click();
        }
    });

    messageInput.addEventListener('focus', () => {
        messageInput.parentElement.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.2)';
        messageInput.parentElement.style.borderColor = '#667eea';
    });

    messageInput.addEventListener('blur', () => {
        messageInput.parentElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        messageInput.parentElement.style.borderColor = 'rgba(226, 232, 240, 0.5)';
    });

    setInterval(() => {
        if (document.getElementById('chatbot').style.display !== 'block') {
            const toggle = document.getElementById('chatbot-toggle');
            toggle.style.animation = 'none';
            setTimeout(() => {
                toggle.style.animation = 'bounceIn 0.6s ease-out';
            }, 10);
        }
    }, 10000);

    if (typeof addChatbotHoverEffects === 'function') {
        addChatbotHoverEffects();
    }
}
}
function addChatbotHoverEffects() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    chatbotToggle.addEventListener('mouseover', () => {
        chatbotToggle.style.backgroundColor = '#0056b3';
        chatbotToggle.style.transform = 'scale(1.1)';
        chatbotToggle.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
    });
    chatbotToggle.addEventListener('mouseout', () => {
        chatbotToggle.style.backgroundColor = '#007bff';
        chatbotToggle.style.transform = 'scale(1)';
        chatbotToggle.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    });
}


function signInWithGoogleDirectly(val = false, onpurpose = false) {
    if (typeof window.signInWithGoogle === 'function' && readability) {
      window.signInWithGoogle(val, onpurpose).then(async (user) => {

        if (user) {
            showLoadingScreen(); 
            userRead();
            fetchAndDisplayData();
        } else {
          hideLoadingScreen(); 
          isSignedIn = false;
          updateHomeButton();
          console.log('Google sign-in failed. Please try again.');
        }
      });
    } else {
      console.error('signInWithGoogle is not defined or not a function');
      hideLoadingScreen(); 
    } 
  } 
  

function changeSlide(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    const slides = document.getElementsByClassName("info-card");
    const dots = document.getElementsByClassName("dot");
    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

let slideIndex = 1;
showSlides(slideIndex);
function nextSlide() {
    slideIndex++;
    showSlides(slideIndex);
}

setInterval(nextSlide, 5000);

document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen(); 
    console.log(".")
    const menuButton = document.getElementById('menu');
    const menu = document.getElementById('hamburger-menu');
    menuButton.style.display = isSignedIn ? 'block' : 'none';
    
    console.log("..")
    document.addEventListener('click', function(event) {
        if (!menuButton.contains(event.target)) {
            if (!menu.classList.contains('closed')) {
                toggleMenu();
            }
        }
    });
    
    console.log("...")
    document.querySelector('.home-button').addEventListener('click', handleHomeClick);

    
    const signInButton = document.querySelector('.sign-in-button');
    if (signInButton) {
        signInButton.addEventListener('click', signInWithGoogleDirectly);
    } 
    console.log("....")
    const storedUserId = localStorage.getItem("efusereId");
    if (storedUserId && readability) {
        console.log("Initializing");
        fetchAndDisplayData();
        userRead();
    } else{        
        hideLoadingScreen(); 
    }
});
let isDropdownVisible = false;
function updateHomeButton() {
    const homeButton = document.querySelector('.home-button');
    const guideButton = document.querySelector('.guide-button');
    const menuButton = document.getElementById('menu');
    const feedbackReportButtons = document.getElementById('feedback-report-buttons');
    const signOutLink = document.getElementById('sign-out');
    if (isSignedIn) {
        guideButton.style.display = 'flex'; 
        guideButton.addEventListener('click',(event)=>{
            showTab(null, "guide");
        });
        homeButton.innerHTML = '<i class="fas fa-user" alt="Profile"></i> <span class="arrow">&#9662;</span>';
        const userEmail = localStorage.getItem("efusereId"); 
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = userEmail; 
        }
        menuButton.style.display = 'block';
        if(feedbackReportButtons){
            feedbackReportButtons.classList.remove('hidden');
        }
        
        homeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleDropdown();
        });
        
        
        signOutLink.addEventListener('click', () => {
            event.preventDefault(); 
            localStorage.removeItem("tabcurrentx");
            localStorage.removeItem("tabcurrenty");
            localStorage.removeItem("efusereId");
            localStorage.removeItem("selectedSemesters");
            localStorage.removeItem("removedSubjects");
            localStorage.removeItem("lastlog");
            localStorage.removeItem("maindataxh");
            localStorage.removeItem("tries");
            localStorage.removeItem("sitestate");
            signInWithGoogleDirectly(true, true);
            window.location.reload(true); 
        });
    } else {
        homeButton.innerHTML = ''; 
        homeButton.textContent = 'Sign In';
        menuButton.style.display = 'none';
        if (feedbackReportButtons) {
            feedbackReportButtons.classList.add('hidden');
        }
    }
} 
function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    isDropdownVisible = !isDropdownVisible;
    dropdownMenu.style.display = isDropdownVisible ? 'block' : 'none';

    if (isDropdownVisible) {
        document.addEventListener('click', closeDropdown);
    } else {
        document.removeEventListener('click', closeDropdown);
    }
}

function closeDropdown(event) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (!dropdownMenu.contains(event.target) && !document.querySelector('.home-button-container').contains(event.target)) {
        isDropdownVisible = false;
        dropdownMenu.style.display = 'none';
        document.removeEventListener('click', closeDropdown);
    }
}