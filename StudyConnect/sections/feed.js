function savePost(post) {
    post.banner = false;
    let list = localStorage.getItem('savedposts');
    list = list ? JSON.parse(list) : [];
    list.push(post);
    localStorage.setItem('savedposts', JSON.stringify(list));
}

function deletePost(post) {
    let list = localStorage.getItem('savedposts');
    list = list ? JSON.parse(list) : [];
    const index = list.findIndex(p => p.time === post.time && p.title === post.title);
    if (index !== -1) {
        list.splice(index, 1);
    }
    localStorage.setItem('savedposts', JSON.stringify(list));
}

function retrievePosts() {
    let list = localStorage.getItem('savedposts');
    return list ? JSON.parse(list) : [];
}

function appendPost(posts) {
    const savedPosts = retrievePosts();
    savedPosts.forEach(post => {
        if (!posts.some(p => p.time === post.time && p.title === post.title)) {
            posts.push(post);
        }
    });
    return posts;
}

function populateFeed(posts, lastlog, inannounce = false) {
    posts = appendPost(posts);
    posts.sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        if (isNaN(dateA) || isNaN(dateB)) {
            console.error('Invalid date encountered:', a.time, b.time);
            return 0;
        }
        return dateB - dateA;
    });
    
    function createAnnouncementPopup() {
        const bannerPosts = posts.filter(post => post.banner);
        if (bannerPosts.length === 0) return;
        
        const randomPost = bannerPosts[Math.floor(Math.random() * bannerPosts.length)];
        
        const popup = document.createElement("div");
        popup.id = "initialbanner";
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(55, 65, 81, 0.95) 100%);
            backdrop-filter: blur(20px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1004;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const container = document.createElement("div");
        container.style.cssText = `
            position: relative;
            max-width: 90%;
            max-height: 90%;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            transform: scale(0.9);
            animation: popIn 0.3s ease-out forwards;
        `;
        
        const image = document.createElement("img");
        image.src = randomPost.image;
        image.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            cursor: pointer;
            transition: transform 0.3s ease;
        `;
        image.onmouseover = () => image.style.transform = 'scale(1.02)';
        image.onmouseout = () => image.style.transform = 'scale(1)';
        image.onclick = function() {
            showTab(event, "feed");
            document.body.removeChild(popup);
        };
        
        const closeButton = document.createElement("button");
        closeButton.innerHTML = "&times;";
        closeButton.style.cssText = `
            position: absolute;
            top: 16px;
            right: 16px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            color: #374151;
            border: none;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        closeButton.onmouseover = () => {
            closeButton.style.background = 'rgba(239, 68, 68, 0.9)';
            closeButton.style.color = 'white';
            closeButton.style.transform = 'scale(1.1)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
            closeButton.style.color = '#374151';
            closeButton.style.transform = 'scale(1)';
        };
        closeButton.onclick = () => document.body.removeChild(popup);
        
        const viewPostButton = document.createElement("button");
        viewPostButton.textContent = "View Post";
        viewPostButton.style.cssText = `
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 32px;
            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        `;
        viewPostButton.onmouseover = () => {
            viewPostButton.style.transform = 'translateX(-50%) translateY(-2px)';
            viewPostButton.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.6)';
        };
        viewPostButton.onmouseout = () => {
            viewPostButton.style.transform = 'translateX(-50%) translateY(0)';
            viewPostButton.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
        };
        viewPostButton.onclick = function() {
            showTab(event, "feed");
            document.body.removeChild(popup);
        };
        
        container.appendChild(image);
        container.appendChild(closeButton);
        container.appendChild(viewPostButton);
        popup.appendChild(container);
        document.body.appendChild(popup);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes popIn {
                from { transform: scale(0.8) translateY(20px); }
                to { transform: scale(1) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const currentTime = new Date();
    const lastLoginTime = new Date(lastlog);
    const oneHourInMilliseconds = 20 * 60 * 1000;

    if ((!lastlog || currentTime - lastLoginTime > oneHourInMilliseconds) && showbanner !== 'dont show') {
        createAnnouncementPopup();
        localStorage.setItem("lastlog", Date.now());
    }
    if (showbanner == 'show already') {
        showbanner = 'dont show';
        try {
            document.getElementById('initialbanner').style.display = "flex";
        } catch(error) {}
    }
    
    const feedContainer = document.getElementById('feed');
    feedContainer.style.cssText = `
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 32px;
        padding: 32px 24px;
        max-width: 100%;
        box-sizing: border-box;
        background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
        min-height: 100vh;
    `;
    
    feedContainer.innerHTML = '';
    
    const filterContainer = document.createElement('div');
    filterContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
        width: 100%;
        max-width: 800px;
        margin-bottom: 24px;
        padding: 24px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.placeholder = 'Search for posts...';
    searchBar.style.cssText = `
        flex: 1;
        min-width: 250px;
        padding: 16px 20px;
        border: 2px solid transparent;
        border-radius: 16px;
        font-size: 16px;
        background: linear-gradient(white, white) padding-box, 
                   linear-gradient(135deg, #3B82F6, #8B5CF6) border-box;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        outline: none;
    `;
    
    searchBar.onfocus = () => {
        searchBar.style.transform = 'translateY(-2px)';
        searchBar.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
    };
    searchBar.onblur = () => {
        searchBar.style.transform = 'translateY(0)';
        searchBar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
    };
    
    function createStylishButton(text, gradient, icon = '') {
        const button = document.createElement('button');
        button.innerHTML = icon ? `<i class="fa ${icon}" style="margin-right: 8px;"></i>${text}` : text;
        button.style.cssText = `
            padding: 16px 24px;
            border: none;
            border-radius: 16px;
            background: linear-gradient(135deg, ${gradient});
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px ${gradient.split(',')[0].replace(')', ', 0.3)')};
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 140px;
        `;
        
        button.onmouseover = () => {
            button.style.transform = 'translateY(-3px)';
            button.style.boxShadow = `0 12px 35px ${gradient.split(',')[0].replace(')', ', 0.4)')}`;
        };
        button.onmouseout = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = `0 8px 25px ${gradient.split(',')[0].replace(')', ', 0.3)')}`;
        };
        
        return button;
    }
    
    const searchButton = createStylishButton('Search', '#3B82F6, #1D4ED8', 'fa-search');
    const filterButton = createStylishButton('Filter by Tag', '#8B5CF6, #7C3AED', 'fa-filter');
    const saveButton = createStylishButton('Saved Posts', '#10B981, #059669', 'fa-bookmark');
    saveButton.id = 'savedpostsfilter';
    
    searchButton.addEventListener('click', () => {
        let searchTerm;
        if (assignmentclick) {
            assignmentclick = false;
            searchTerm = "assignment";
        } else {
            searchTerm = searchBar.value.toLowerCase();
        }
        
        const filteredPosts = posts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            post.text.toLowerCase().includes(searchTerm) ||
            post.sender.toLowerCase().includes(searchTerm) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        displayPosts(filteredPosts);
        document.getElementById('savedpostsfilter').innerHTML = '<i class="fa fa-bookmark" style="margin-right: 8px;"></i>Saved Posts';
    });
    
    tagfilterapplier = searchButton;
    
    searchBar.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });
    
    function showFilterModal() {
        const modalBackground = document.createElement('div');
        modalBackground.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(55, 65, 81, 0.8) 100%);
            backdrop-filter: blur(20px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.style.cssText = `
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
            padding: 32px;
            border-radius: 24px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            position: relative;
            box-sizing: border-box;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: scale(0.9);
            animation: popIn 0.3s ease-out forwards;
        `;
        
        const title = document.createElement('h2');
        title.textContent = 'Filter by Tags';
        title.style.cssText = `
            margin: 0 0 24px 0;
            color: #1F2937;
            font-size: 24px;
            font-weight: 700;
            text-align: center;
        `;
        
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.1);
            color: #EF4444;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        closeButton.onmouseover = () => {
            closeButton.style.background = '#EF4444';
            closeButton.style.color = 'white';
            closeButton.style.transform = 'scale(1.1)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'rgba(239, 68, 68, 0.1)';
            closeButton.style.color = '#EF4444';
            closeButton.style.transform = 'scale(1)';
        };
        closeButton.addEventListener('click', () => document.body.removeChild(modalBackground));
        
        const searchBarModal = document.createElement('input');
        searchBarModal.type = 'text';
        searchBarModal.placeholder = 'Search for tags...';
        searchBarModal.style.cssText = `
            width: 100%;
            padding: 16px 20px;
            margin-bottom: 20px;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            font-size: 16px;
            box-sizing: border-box;
            transition: all 0.3s ease;
        `;
        
        searchBarModal.onfocus = () => {
            searchBarModal.style.borderColor = '#3B82F6';
            searchBarModal.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        };
        
        const tagListContainer = document.createElement('div');
        tagListContainer.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: 24px;
            padding: 16px;
            background: rgba(249, 250, 251, 0.5);
            border-radius: 12px;
            border: 1px solid #E5E7EB;
        `;
        
        const uniqueTags = [...new Set(posts.flatMap(post => post.tags))];
        const tagCheckboxes = {};
        
        uniqueTags.forEach(tag => {
            const label = document.createElement('label');
            label.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
                border: 1px solid #E5E7EB;
            `;
            
            label.onmouseover = () => {
                label.style.background = '#F3F4F6';
                label.style.transform = 'translateX(4px)';
            };
            label.onmouseout = () => {
                label.style.background = 'white';
                label.style.transform = 'translateX(0)';
            };
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = tag;
            checkbox.style.cssText = `
                margin-right: 12px;
                width: 18px;
                height: 18px;
                accent-color: #3B82F6;
            `;
            
            const tagText = document.createElement('span');
            tagText.textContent = tag;
            tagText.style.cssText = `
                font-size: 14px;
                color: #374151;
                font-weight: 500;
            `;
            
            label.appendChild(checkbox);
            label.appendChild(tagText);
            tagListContainer.appendChild(label);
            tagCheckboxes[tag] = checkbox;
        });
        
        searchBarModal.addEventListener('input', () => {
            const searchTerm = searchBarModal.value.toLowerCase();
            uniqueTags.forEach(tag => {
                const label = tagCheckboxes[tag].parentElement;
                label.style.display = tag.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
            });
        });
        
        const applyButton = createStylishButton('Apply Filter', '#10B981, #059669', 'fa-check');
        applyButton.style.width = '100%';
        applyButton.addEventListener('click', () => {
            const selectedTags = Object.keys(tagCheckboxes).filter(tag => tagCheckboxes[tag].checked);
            filterPostsByTags(selectedTags);
            document.body.removeChild(modalBackground);
        });
        
        modalContainer.appendChild(title);
        modalContainer.appendChild(closeButton);
        modalContainer.appendChild(searchBarModal);
        modalContainer.appendChild(tagListContainer);
        modalContainer.appendChild(applyButton);
        modalBackground.appendChild(modalContainer);
        document.body.appendChild(modalBackground);
    }
    
    function filterPostsByTags(selectedTags) {
        const filteredPosts = posts.filter(post => {
            const postTags = post.tags;
            const hasAllTags = selectedTags.every(tag => postTags.includes(tag));
            return selectedTags.length === 0 || hasAllTags;
        });
        displayPosts(filteredPosts);
        document.getElementById('savedpostsfilter').innerHTML = '<i class="fa fa-bookmark" style="margin-right: 8px;"></i>Saved Posts';
    }
    
    filterButton.addEventListener('click', showFilterModal);
    
    saveButton.addEventListener('click', () => {
        if (saveButton.innerHTML.includes('All Posts')) {
            saveButton.innerHTML = '<i class="fa fa-bookmark" style="margin-right: 8px;"></i>Saved Posts';
            displayPosts(posts);
        } else {
            const savedPosts = retrievePosts();
            displayPosts(savedPosts);
            saveButton.innerHTML = '<i class="fa fa-list" style="margin-right: 8px;"></i>All Posts';
        }
    });
    
    filterContainer.appendChild(searchBar);
    filterContainer.appendChild(searchButton);
    filterContainer.appendChild(filterButton);
    filterContainer.appendChild(saveButton);
    feedContainer.appendChild(filterContainer);
    
    const postsByDate = posts.reduce((acc, post) => {
        const date = new Date(post.time).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(post);
        return acc;
    }, {});
    
    const noteSection = document.createElement('div');
    noteSection.style.cssText = `
        width: 100%;
        max-width: 800px;
        padding: 24px;
        margin-bottom: 32px;
        background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
        color: #92400E;
        border: 2px solid #F59E0B;
        border-radius: 20px;
        text-align: center;
        font-size: 16px;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2);
        position: relative;
        overflow: hidden;
    `;
    
    noteSection.innerHTML = `
        <div style="position: absolute; top: -50%; right: -50%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
        <strong style="display: block; margin-bottom: 8px; font-size: 18px;">📢 Important Notice</strong>
        Note: All of these announcements are forwarded from various sources like WhatsApp, Mail, ERP. They are not officially made here, and none of these announcements are added here by any officials.
    `;
    
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.style.cssText = `
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
            border-radius: 24px;
            border: 1px solid rgba(226, 232, 240, 0.8);
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            width: 360px;
            max-width: 100%;
            box-sizing: border-box;
            position: relative;
            text-align: center;
            margin: 0 auto;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            overflow: hidden;
        `;
        
        postElement.onmouseover = () => {
            postElement.style.transform = 'translateY(-8px)';
            postElement.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.12)';
        };
        postElement.onmouseout = () => {
            postElement.style.transform = 'translateY(0)';
            postElement.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.08)';
        };
        
        const bgElement = document.createElement('div');
        bgElement.style.cssText = `
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
            pointer-events: none;
            animation: float 6s ease-in-out infinite;
        `;
        postElement.appendChild(bgElement);
        
        postElement.setAttribute('data-tags', post.tags.join(','));
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            text-align: left;
            position: relative;
            z-index: 1;
        `;
        
        const senderInfo = document.createElement('div');
        senderInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        `;
        avatar.textContent = post.sender.charAt(0).toUpperCase();
        
        const senderDetails = document.createElement('div');
        const senderName = document.createElement('div');
        senderName.innerHTML = `<strong>${post.sender}</strong>`;
        senderName.style.cssText = `
            font-size: 16px;
            color: #1F2937;
            font-weight: 600;
            margin-bottom: 4px;
        `;
        
        const postTime = document.createElement('div');
        postTime.textContent = new Date(post.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        postTime.style.cssText = `
            font-size: 12px;
            color: #6B7280;
            font-weight: 500;
        `;
        
        senderDetails.appendChild(senderName);
        senderDetails.appendChild(postTime);
        senderInfo.appendChild(avatar);
        senderInfo.appendChild(senderDetails);
        header.appendChild(senderInfo);    
        
        const textContainer = document.createElement('div');
        textContainer.style.cssText = `
            position: relative;
            text-align: left;
            z-index: 1;
        `;
        
        const text = document.createElement('div');
        text.style.cssText = `
            font-size: 15px;
            line-height: 1.6;
            color: #4B5563;
            word-break: break-word;
            overflow-wrap: break-word;
            position: relative;
        `;
        
        const MAX_LENGTH = 150;
        const originalText = post.text;
        
        function updateTextDisplay() {
            function makeLinksClickable(text) {
                const urlStart = '/url';
                const urlEnd = 'url/';
                let urls = [];
                
                text = text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
                    const cleanUrl = match.split(' ')[0];
                    urls.push(cleanUrl);
                    return `${urlStart}${urls.length - 1}${urlEnd}`;
                });
                
                text = text.replace(/(\+?\d{1,4}[\s.-]?\(?\d{1,3}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9})/g, '<a href="tel:$1" style="color: #3B82F6; text-decoration: none; font-weight: 500;">$1</a>');
                
                text = text.replace(new RegExp(urlStart + '(\\d+)' + urlEnd, 'g'), (match, index) => {
                    let url1 = urls[index];
                    let url = urls[index];
                    
                    if (url.includes('\\n')) {
                        url = url.replace(/\\n/g, '');
                    }
                    
                    return `<a href="${url}" target="_blank" style="color: #3B82F6; text-decoration: none; font-weight: 500; padding: 4px 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(59, 130, 246, 0.1)'">${url1}</a>`;
                });
                
                text = text.replace(/\\n/g, '<br>');
                return text;
            }
            
            if (originalText.length > MAX_LENGTH) {
                text.innerHTML = makeLinksClickable(originalText.slice(0, MAX_LENGTH)) + '... <a href="#" class="read-more" style="color: #3B82F6; text-decoration: none; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: rgba(59, 130, 246, 0.1); transition: all 0.3s ease;">Read more</a>';
                const readMoreLink = text.querySelector('.read-more');
                readMoreLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    text.innerHTML = makeLinksClickable(originalText) + ' <a href="#" class="read-less" style="color: #EF4444; text-decoration: none; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); transition: all 0.3s ease;">Read less</a>';
                    const readLessLink = text.querySelector('.read-less');
                    readLessLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        updateTextDisplay();
                    });
                });
            } else {
                text.innerHTML = makeLinksClickable(originalText);
            }
        }
        
        updateTextDisplay();
        textContainer.appendChild(text);
        
        function updateDeadlineDisplay(deadlineElement, deadlineDate) {
            const now = new Date();
            const timeLeft = deadlineDate - now;
            
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            let color, bgColor, displayText, icon;
            
            if (timeLeft < 0) {
                const passedDays = Math.abs(days);
                displayText = `⏰ Overdue by ${passedDays} days`;
                color = '#FFFFFF';
                bgColor = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                icon = '⚠️';
            } else if (days < 1) {
                displayText = `🔥 Due in ${hours}h ${minutes}m`;
                color = '#FFFFFF';
                bgColor = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
                icon = '⏳';
            } else if (days < 7) {
                displayText = `✨ Due in ${days}d ${hours}h`;
                color = '#FFFFFF';
                bgColor = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                icon = '📅';
            } else {
                displayText = `🗓️ Due in ${days} days`;
                color = '#FFFFFF';
                bgColor = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';
                icon = '📋';
            }
            
            deadlineElement.innerHTML = `
                <span style="margin-right: 8px; font-size: 16px;">${icon}</span>
                ${displayText}
            `;
            deadlineElement.style.cssText = `
                display: inline-block;
                padding: 12px 20px;
                margin-top: 16px;
                background: ${bgColor};
                color: ${color};
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: pulse 2s infinite;
            `;
        }
        
        if (post.deadline) {
            const deadlineElement = document.createElement('div');
            const deadlineDate = new Date(post.deadline);
            
            updateDeadlineDisplay(deadlineElement, deadlineDate);
            setInterval(() => {
                updateDeadlineDisplay(deadlineElement, deadlineDate);
            }, 1000);
            
            textContainer.appendChild(deadlineElement);
        }
        
        if (post.tags) {
            const tagsContainer = document.createElement('div');
            tagsContainer.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-top: 20px;
                flex-wrap: wrap;
            `;
            
            const viewTagsButton = createStylishButton('View Tags', '#8B5CF6, #7C3AED', 'fa-tags');
            viewTagsButton.style.cssText += 'font-size: 14px; padding: 10px 16px; min-width: auto;';
            viewTagsButton.addEventListener('click', () => {
                showAlert(`Tags: <br>${post.tags.join(', ')}`, "https://cdn.iconscout.com/icon/free/png-256/free-hang-tags-icon-download-in-svg-png-gif-file-formats--printing-label-pricing-tag-print-space-services-pack-icons-1556248.png");
            });
            
            const savePostButton = createStylishButton('Save Post', '#10B981, #059669', 'fa-heart');
            savePostButton.style.cssText += 'font-size: 14px; padding: 10px 16px; min-width: auto;';
            
            function toggleSave(post, torun) {
                let savedPosts = retrievePosts();
                let exists = savedPosts.some(p => p.time === post.time && p.title === post.title);
                
                if (exists && torun || !exists && !torun) {
                    if (torun) {
                        deletePost(post);
                    } else {
                        exists = !exists;
                    }
                    savePostButton.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                    savePostButton.innerHTML = '<i class="fa fa-heart" style="margin-right: 8px;"></i>Save Post';
                    savePostButton.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                } else {
                    if (torun) {
                        savePost(post);
                    } else {
                        exists = !exists;
                    }
                    savePostButton.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                    savePostButton.innerHTML = '<i class="fa fa-heart-broken" style="margin-right: 8px;"></i>Remove';
                    savePostButton.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
                }
            }
            
            savePostButton.addEventListener('click', () => toggleSave(post, true));
            toggleSave(post, false);
            
            tagsContainer.appendChild(viewTagsButton);
            tagsContainer.appendChild(savePostButton);
            textContainer.appendChild(tagsContainer);
        }
        
        postElement.appendChild(header);
        
        if (post.image) {
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = `
                position: relative;
                border-radius: 16px;
                overflow: hidden;
                margin-bottom: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            `;
            
            const img = document.createElement('img');
            img.src = post.image;
            img.alt = post.title;
            img.style.cssText = `
                width: 100%;
                height: auto;
                display: block;
                transition: transform 0.3s ease;
            `;
            
            imgContainer.onmouseover = () => img.style.transform = 'scale(1.05)';
            imgContainer.onmouseout = () => img.style.transform = 'scale(1)';
            
            imgContainer.appendChild(img);
            postElement.appendChild(imgContainer);
        }
        
        if (post.title) {
            const title = document.createElement('div');
            title.textContent = post.title;
            title.style.cssText = `
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 16px;
                color: #1F2937;
                line-height: 1.3;
                position: relative;
                z-index: 1;
            `;
            postElement.appendChild(title);
        }
        
        postElement.appendChild(textContainer);
        
        return postElement;
    }
    
    function displayPosts(filteredPosts) {
        feedContainer.innerHTML = '';
        feedContainer.appendChild(filterContainer);
        feedContainer.appendChild(noteSection);
        
        const postsByDate = filteredPosts.reduce((acc, post) => {
            const date = new Date(post.time).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            if (!acc[date]) acc[date] = [];
            acc[date].push(post);
            return acc;
        }, {});
        
        Object.entries(postsByDate).forEach(([date, posts]) => {
            if (posts.length > 0) {
                const dateHeading = document.createElement('h2');
                dateHeading.textContent = date;
                dateHeading.style.cssText = `
                    font-size: 28px;
                    font-weight: 800;
                    color: #1F2937;
                    margin: 40px 0 32px 0;
                    text-align: center;
                    position: relative;
                    padding-bottom: 16px;
                `;
                
                const underline = document.createElement('div');
                underline.style.cssText = `
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 80px;
                    height: 4px;
                    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
                    border-radius: 2px;
                `;
                dateHeading.appendChild(underline);
                feedContainer.appendChild(dateHeading);
                
                const postsContainer = document.createElement('div');
                postsContainer.style.cssText = `
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
                    gap: 32px;
                    justify-items: center;
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 16px;
                `;
                
                posts.forEach(post => {
                    const postElement = createPostElement(post);
                    postsContainer.appendChild(postElement);
                });
                
                feedContainer.appendChild(postsContainer);
            }
        });
        
        feedContainer.style.display = 'flex';
    }
    
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes popIn {
            from { 
                transform: scale(0.8) translateY(20px);
                opacity: 0;
            }
            to { 
                transform: scale(1) translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes float {
            0%, 100% { transform: rotate(0deg) translateY(0px); }
            50% { transform: rotate(180deg) translateY(-10px); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .shimmer {
            background: linear-gradient(90deg, transparent 25%, rgba(255, 255, 255, 0.4) 50%, transparent 75%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
        
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(241, 245, 249, 0.8);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%);
        }
        
        .glass {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
    `;
    document.head.appendChild(globalStyle);
    
    displayPosts(posts);
}