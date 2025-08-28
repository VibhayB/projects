function populateOnlineSites(onlineSites) {
    let hiddenSites = window.hiddenSites || [];
    let customSites = window.customSites || [];
    
    onlineSites = onlineSites.filter(site => !hiddenSites.some(hiddenSite => hiddenSite.name === site.name));
    
    onlineSites = [...onlineSites, ...customSites];
    
    onlineSites.sort((a, b) => a.name.localeCompare(b.name));
    const onlineSitesContainer = document.getElementById('sites');
    onlineSitesContainer.innerHTML = '';

    Object.assign(onlineSitesContainer.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '32px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden',
    });

    const bgPattern = document.createElement('div');
    Object.assign(bgPattern.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        opacity: '0.03',
        background: 'radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: '0',
    });
    onlineSitesContainer.appendChild(bgPattern);

    if (!document.getElementById('sites-animations')) {
        const style = document.createElement('style');
        style.id = 'sites-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes float {
                0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
                33% { transform: translate(2%, -2%) rotate(1deg); }
                66% { transform: translate(-2%, 2%) rotate(-1deg); }
            }
            
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            .site-item {
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, background 0.3s ease;
                will-change: transform;
            }
            
            .site-item:hover {
                transform: translateY(-8px) scale(1.02);
            }
            
            .search-focus {
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), 0 4px 20px rgba(99, 102, 241, 0.1) !important;
                border-color: #6366f1 !important;
            }
            
            .button-hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            }
        `;
        document.head.appendChild(style);
    }

    const contentWrapper = document.createElement('div');
    Object.assign(contentWrapper.style, {
        position: 'relative',
        zIndex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    });

    const searchContainer = document.createElement('div');
    Object.assign(searchContainer.style, {
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
    });

    const searchBar = document.createElement('input');
    Object.assign(searchBar.style, {
        width: '100%',
        padding: '16px 20px 16px 56px',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '16px',
        boxSizing: 'border-box',
        fontSize: '16px',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        color: '#1a1a1a',
        outline: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
    });
    searchBar.type = 'text';
    searchBar.placeholder = 'Search for amazing sites...';
    searchBar.id = 'searchBar';

    const searchIcon = document.createElement('div');
    searchIcon.innerHTML = '🔍';
    Object.assign(searchIcon.style, {
        position: 'absolute',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '18px',
        opacity: '0.7',
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
    });

    searchBar.addEventListener('focus', () => {
        searchBar.classList.add('search-focus');
        searchIcon.style.opacity = '1';
        searchIcon.style.transform = 'translateY(-50%) scale(1.1)';
    });
    searchBar.addEventListener('blur', () => {
        searchBar.classList.remove('search-focus');
        searchIcon.style.opacity = '0.7';
        searchIcon.style.transform = 'translateY(-50%) scale(1)';
    });

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchBar);

    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        width: '100%',
        flexWrap: 'wrap',
    });

    const addButton = document.createElement('button');
    const removeButton = document.createElement('button');
    const addCustomButton = document.createElement('button');
    
    [addButton, removeButton, addCustomButton].forEach((btn) => {
        Object.assign(btn.style, {
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            color: '#fff',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
        });
        
        btn.addEventListener('mouseenter', () => btn.classList.add('button-hover'));
        btn.addEventListener('mouseleave', () => btn.classList.remove('button-hover'));
    });

    addButton.textContent = '✨ Add Site';
    addButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    addButton.onclick = () => showAddSitePopup();

    addCustomButton.textContent = '🚀 Add Custom';
    addCustomButton.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    addCustomButton.onclick = () => showAddCustomSitePopup();

    removeButton.textContent = '🗑️ Remove Site';
    removeButton.style.background = 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)';
    removeButton.onclick = () => toggleRemoveMode();

    buttonContainer.appendChild(addButton);
    buttonContainer.appendChild(addCustomButton);
    buttonContainer.appendChild(removeButton);

    const onlineSitesContent = document.createElement('div');
    onlineSitesContent.id = 'onlineSitesContent';
    Object.assign(onlineSitesContent.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '20px',
        justifyItems: 'center',
        animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    });

    contentWrapper.appendChild(searchContainer);
    contentWrapper.appendChild(buttonContainer);
    contentWrapper.appendChild(onlineSitesContent);
    onlineSitesContainer.appendChild(contentWrapper);

    let isRemoveMode = false;

    const renderSites = (filteredSites) => {
        filteredSites.sort((a, b) => a.name.localeCompare(b.name));
        onlineSitesContent.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        
        filteredSites.forEach((site, index) => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            Object.assign(siteItem.style, {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '170px',
                height: '200px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                boxSizing: 'border-box',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                animation: `fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
                transformOrigin: 'center bottom',
            });

            if (isRemoveMode) {
                const removeIcon = document.createElement('div');
                removeIcon.innerHTML = '❌';
                Object.assign(removeIcon.style, {
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: '10',
                    boxShadow: '0 4px 15px rgba(255,107,107,0.3)',
                    transition: 'all 0.3s ease',
                });
                
                removeIcon.addEventListener('mouseenter', () => {
                    removeIcon.style.transform = 'scale(1.1)';
                    removeIcon.style.boxShadow = '0 6px 20px rgba(255,107,107,0.4)';
                });
                removeIcon.addEventListener('mouseleave', () => {
                    removeIcon.style.transform = 'scale(1)';
                    removeIcon.style.boxShadow = '0 4px 15px rgba(255,107,107,0.3)';
                });
                
                removeIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    const isCustomSite = customSites.some(customSite => 
                        customSite.name === site.name && customSite.url === site.url
                    );
                    
                    if (isCustomSite) {
                        customSites = customSites.filter(s => 
                            !(s.name === site.name && s.url === site.url)
                        );
                        window.customSites = customSites;
                    } else {
                        hiddenSites.push(site);
                        window.hiddenSites = hiddenSites;
                    }
                    
                    siteItem.style.animation = 'fadeInUp 0.3s ease-out reverse';
                    setTimeout(() => {
                        onlineSites = onlineSites.filter(s => 
                            !(s.name === site.name && s.url === site.url)
                        );
                        renderSites(onlineSites);
                    }, 300);
                });
                siteItem.appendChild(removeIcon);
            } else {
                siteItem.onclick = () => window.open(site.url, '_blank');
            }

            const imgContainer = document.createElement('div');
            Object.assign(imgContainer.style, {
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                marginBottom: '16px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                position: 'relative',
            });

            const shimmer = document.createElement('div');
            Object.assign(shimmer.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                opacity: '0',
            });

            const img = document.createElement('img');
            img.src = site.icon;
            img.alt = site.name;
            Object.assign(img.style, {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
            });

            img.onload = () => {
                shimmer.style.opacity = '0';
                img.style.opacity = '1';
            };
            img.onerror = () => {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzZmNmY2ZiIvPgo8cGF0aCBkPSJNMjAgMjBINDRWNDRIMjBWMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                shimmer.style.opacity = '0';
            };

            const name = document.createElement('p');
            name.textContent = site.name;
            Object.assign(name.style, {
                margin: '0',
                fontSize: '15px',
                fontWeight: '600',
                color: '#1a1a1a',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(255,255,255,0.5)',
            });

            imgContainer.appendChild(shimmer);
            imgContainer.appendChild(img);
            siteItem.appendChild(imgContainer);
            siteItem.appendChild(name);
            fragment.appendChild(siteItem);
        });
        
        onlineSitesContent.appendChild(fragment);
    };

    renderSites(onlineSites);

    let searchTimeout;
    searchBar.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchQuery = e.target.value.toLowerCase();
            const filteredSites = onlineSites.filter(site => 
                site.name.toLowerCase().includes(searchQuery)
            );
            renderSites(filteredSites);
        }, 150);
    });

    function toggleRemoveMode() {
        isRemoveMode = !isRemoveMode;
        removeButton.textContent = isRemoveMode ? '✅ Done' : '🗑️ Remove Site';
        removeButton.style.background = isRemoveMode ? 
            'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)' : 
            'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)';
        renderSites(onlineSites);
    }

    function showAddCustomSitePopup() {
        const backdrop = document.createElement('div');
        Object.assign(backdrop.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: '999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInUp 0.3s ease',
        });
        
        const popup = document.createElement('div');
        Object.assign(popup.style, {
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '32px',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: '1000',
            width: '450px',
            maxWidth: '90%',
            textAlign: 'center',
            animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        });

        const title = document.createElement('h3');
        title.textContent = '✨ Add Custom Site';
        Object.assign(title.style, {
            margin: '0 0 24px 0',
            fontSize: '24px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        });

        const form = document.createElement('div');
        Object.assign(form.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '24px',
        });

        const createInput = (placeholder, type = 'text') => {
            const input = document.createElement('input');
            input.type = type;
            input.placeholder = placeholder;
            Object.assign(input.style, {
                padding: '16px 20px',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                background: 'rgba(255,255,255,0.8)',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            });
            
            input.addEventListener('focus', () => {
                input.style.borderColor = '#667eea';
                input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 20px rgba(0,0,0,0.1)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = 'rgba(0,0,0,0.1)';
                input.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            });
            
            return input;
        };

        const nameInput = createInput('Site name (e.g., Google)');
        const urlInput = createInput('Site URL (e.g., https://google.com)', 'url');
        const iconInput = createInput('Icon URL (optional)', 'url');

        form.appendChild(nameInput);
        form.appendChild(urlInput);
        form.appendChild(iconInput);

        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
        });

        const createButton = (text, gradient, action) => {
            const button = document.createElement('button');
            button.textContent = text;
            Object.assign(button.style, {
                background: gradient,
                color: '#fff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            });
            
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            });
            
            button.onclick = action;
            return button;
        };

        function closePopup() {
            backdrop.style.animation = 'fadeInUp 0.3s ease reverse';
            setTimeout(() => document.body.removeChild(backdrop), 300);
        }

        const addButton = createButton('🚀 Add Site', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            const icon = iconInput.value.trim() || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

            if (!name || !url) {
                const error = document.createElement('div');
                error.textContent = '⚠️ Please fill in both name and URL fields';
                Object.assign(error.style, {
                    color: '#f5576c',
                    fontSize: '14px',
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(245, 87, 108, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 87, 108, 0.2)',
                });
                form.appendChild(error);
                setTimeout(() => form.removeChild(error), 3000);
                return;
            }

            try {
                new URL(url);
            } catch {
                const error = document.createElement('div');
                error.textContent = '⚠️ Please enter a valid URL (e.g., https://example.com)';
                Object.assign(error.style, {
                    color: '#f5576c',
                    fontSize: '14px',
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(245, 87, 108, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 87, 108, 0.2)',
                });
                form.appendChild(error);
                setTimeout(() => form.removeChild(error), 3000);
                return;
            }

            const newSite = { name, url, icon };
            
            customSites.push(newSite);
            window.customSites = customSites;
            
            onlineSites.push(newSite);
            renderSites(onlineSites);
            closePopup();
        });

        const cancelButton = createButton('Cancel', 'linear-gradient(135deg, #6c757d 0%, #495057 100%)', closePopup);

        backdrop.onclick = (e) => {
            if (e.target === backdrop) closePopup();
        };

        buttonContainer.appendChild(addButton);
        buttonContainer.appendChild(cancelButton);
        popup.appendChild(title);
        popup.appendChild(form);
        popup.appendChild(buttonContainer);
        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);
    }

    function showAddSitePopup() {
        const backdrop = document.createElement('div');
        Object.assign(backdrop.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: '999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInUp 0.3s ease',
        });
        
        const popup = document.createElement('div');
        Object.assign(popup.style, {
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '32px',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: '1000',
            width: '450px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            textAlign: 'center',
            animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        });

        const title = document.createElement('h3');
        title.textContent = '✨ Add Sites';
        Object.assign(title.style, {
            margin: '0 0 24px 0',
            fontSize: '24px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        });

        const siteList = document.createElement('div');
        Object.assign(siteList.style, {
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '24px',
            textAlign: 'left',
            gap: '12px',
            display: 'flex',
            flexDirection: 'column',
        });

        hiddenSites.forEach((site, index) => {
            const siteContainer = document.createElement('div');
            Object.assign(siteContainer.style, {
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            });

            const siteCheckbox = document.createElement('input');
            siteCheckbox.type = 'checkbox';
            siteCheckbox.value = site.name;
            siteCheckbox.id = `site-${index}`;
            Object.assign(siteCheckbox.style, {
                margin: '0 12px 0 0',
                width: '20px',
                height: '20px',
                accentColor: '#667eea',
            });

            const siteLabel = document.createElement('label');
            siteLabel.textContent = site.name;
            siteLabel.htmlFor = `site-${index}`;
            Object.assign(siteLabel.style, {
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                color: '#333',
                userSelect: 'none',
                flex: '1',
            });

            siteContainer.addEventListener('mouseenter', () => {
                siteContainer.style.background = 'rgba(102, 126, 234, 0.1)';
                siteContainer.style.transform = 'translateY(-1px)';
                siteContainer.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            });
            siteContainer.addEventListener('mouseleave', () => {
                siteContainer.style.background = 'rgba(255,255,255,0.6)';
                siteContainer.style.transform = 'translateY(0)';
                siteContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            });

            siteContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                siteCheckbox.checked = !siteCheckbox.checked;
            });

            siteContainer.appendChild(siteCheckbox);
            siteContainer.appendChild(siteLabel);
            siteList.appendChild(siteContainer);
        });
        
        popup.appendChild(title);
        popup.appendChild(siteList);

        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
        });

        const createButton = (text, gradient, action) => {
            const button = document.createElement('button');
            button.textContent = text;
            Object.assign(button.style, {
                background: gradient,
                color: '#fff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            });
            
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            });
            
            button.onclick = action;
            return button;
        };

        function closePopup() {
            backdrop.style.animation = 'fadeInUp 0.3s ease reverse';
            setTimeout(() => document.body.removeChild(backdrop), 300);
        }

        const confirmButton = createButton('✨ Add Selected', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', () => {
            const selectedSites = Array.from(siteList.querySelectorAll('input:checked')).map(input => input.value);
            hiddenSites = hiddenSites.filter(site => {
                if (selectedSites.includes(site.name)) {
                    onlineSites.push(site);
                    return false;
                }
                return true;
            });
            window.hiddenSites = hiddenSites;
            renderSites(onlineSites);
            closePopup();
        });

        const cancelButton = createButton('Cancel', 'linear-gradient(135deg, #6c757d 0%, #495057 100%)', closePopup);

        popup.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        backdrop.onclick = closePopup;

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        popup.appendChild(buttonContainer);
        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);
    }
}