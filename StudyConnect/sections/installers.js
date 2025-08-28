function populateInstallers(installers) {
    const installersContainer = document.getElementById('installers');
    
    installersContainer.style.display = 'flex';
    installersContainer.style.flexWrap = 'wrap';
    installersContainer.style.gap = '16px';
    installersContainer.style.padding = '20px';
    installersContainer.style.width = '100%';
    installersContainer.style.boxSizing = 'border-box';
    installersContainer.style.backgroundColor = '#ffffff';
    installersContainer.style.borderRadius = '8px';
    installersContainer.style.border = '1px solid #e5e5e5';
    installersContainer.style.justifyContent = 'center';

    installersContainer.innerHTML = '';

    installers.forEach(installer => {
        const installerItem = document.createElement('div');
        
        installerItem.style.display = 'flex';
        installerItem.style.flexDirection = 'column';
        installerItem.style.alignItems = 'center';
        installerItem.style.justifyContent = 'center';
        installerItem.style.flex = '1 1 calc(20% - 16px)'; 
        installerItem.style.minWidth = '150px';
        installerItem.style.maxWidth = '200px';
        installerItem.style.height = '180px';
        installerItem.style.backgroundColor = '#ffffff';
        installerItem.style.borderRadius = '8px';
        installerItem.style.border = '1px solid #e0e0e0';
        installerItem.style.cursor = 'pointer';
        installerItem.style.transition = 'all 0.2s ease';
        installerItem.style.boxSizing = 'border-box';
        installerItem.style.padding = '16px';
        installerItem.style.textAlign = 'center';
        installerItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        
        installerItem.onmouseover = () => {
            installerItem.style.transform = 'translateY(-2px)';
            installerItem.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            installerItem.style.borderColor = '#2563eb';
        };
        
        installerItem.onmouseout = () => {
            installerItem.style.transform = 'translateY(0)';
            installerItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
            installerItem.style.borderColor = '#e0e0e0';
        };

        installerItem.onclick = () => {
            window.open(installer.url, '_blank');
        };

        const img = document.createElement('img');
        img.src = installer.icon;
        img.alt = installer.name;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '12px';
        img.style.boxSizing = 'border-box';
        img.style.marginBottom = '12px';
        img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        
        img.onerror = () => {
            img.style.display = 'none';
            const fallbackIcon = document.createElement('div');
            fallbackIcon.style.width = '80px';
            fallbackIcon.style.height = '80px';
            fallbackIcon.style.backgroundColor = '#3b82f6';
            fallbackIcon.style.borderRadius = '12px';
            fallbackIcon.style.display = 'flex';
            fallbackIcon.style.alignItems = 'center';
            fallbackIcon.style.justifyContent = 'center';
            fallbackIcon.style.fontSize = '32px';
            fallbackIcon.style.color = '#ffffff';
            fallbackIcon.style.marginBottom = '12px';
            fallbackIcon.textContent = installer.name.charAt(0).toUpperCase();
            installerItem.insertBefore(fallbackIcon, img.nextSibling);
        };

        const name = document.createElement('div');
        name.textContent = installer.name;
        name.style.fontSize = '14px';
        name.style.fontWeight = '500';
        name.style.color = '#1f2937';
        name.style.lineHeight = '1.3';
        name.style.wordWrap = 'break-word';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        name.style.display = '-webkit-box';
        name.style.webkitLineClamp = '2';
        name.style.webkitBoxOrient = 'vertical';
        name.style.margin = '0';
        name.title = installer.name; 

        installerItem.appendChild(img);
        installerItem.appendChild(name);
        installersContainer.appendChild(installerItem);
    });
    
}