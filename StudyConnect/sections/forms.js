function populateForms(forms) {
    const formsContainer = document.getElementById('forms');

    formsContainer.style.display = 'flex';
    formsContainer.style.flexWrap = 'wrap';
    formsContainer.style.gap = '16px';
    formsContainer.style.padding = '20px';
    formsContainer.style.width = '100%';
    formsContainer.style.boxSizing = 'border-box';
    formsContainer.style.backgroundColor = '#ffffff';
    formsContainer.style.borderRadius = '8px';
    formsContainer.style.border = '1px solid #e5e5e5';
    formsContainer.style.justifyContent = 'center';

    formsContainer.innerHTML = '';

    forms.forEach((form, index) => {
        const formItem = document.createElement('div');
        
        formItem.style.display = 'flex';
        formItem.style.alignItems = 'center';
        formItem.style.position = 'relative';
        formItem.style.flex = '1 1 300px';
        formItem.style.maxWidth = '400px';
        formItem.style.height = '80px';
        formItem.style.backgroundColor = '#ffffff';
        formItem.style.borderRadius = '8px';
        formItem.style.border = '1px solid #e0e0e0';
        formItem.style.cursor = 'pointer';
        formItem.style.transition = 'all 0.2s ease';
        formItem.style.boxSizing = 'border-box';
        formItem.style.padding = '16px';
        formItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';

        formItem.onmouseover = () => {
            formItem.style.transform = 'translateY(-2px)';
            formItem.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            formItem.style.borderColor = '#2563eb';
        };
        
        formItem.onmouseout = () => {
            formItem.style.transform = 'translateY(0)';
            formItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
            formItem.style.borderColor = '#e0e0e0';
        };

        const link = document.createElement('a');
        link.href = form.url;
        link.target = '_blank';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
        link.style.display = 'flex';
        link.style.alignItems = 'center';
        link.style.width = '100%';
        link.style.height = '100%';

        const iconContainer = document.createElement('div');
        iconContainer.style.width = '40px';
        iconContainer.style.height = '40px';
        iconContainer.style.marginRight = '12px';
        iconContainer.style.flexShrink = '0';
        iconContainer.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#3b82f6"/>
                <path d="M14 2V8H20" fill="#ffffff"/>
                <path d="M16 13H8V15H16V13Z" fill="#ffffff"/>
                <path d="M16 17H8V19H16V17Z" fill="#ffffff"/>
                <path d="M10 9H8V11H10V9Z" fill="#ffffff"/>
            </svg>
        `;

        const nameContainer = document.createElement('div');
        nameContainer.style.flex = '1';
        nameContainer.style.overflow = 'hidden';

        const name = document.createElement('div');
        name.textContent = form.name;
        name.style.fontSize = '14px';
        name.style.fontWeight = '500';
        name.style.color = '#1f2937';
        name.style.lineHeight = '1.4';
        name.style.wordWrap = 'break-word';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        name.style.whiteSpace = 'nowrap';
        name.title = form.name;

        nameContainer.appendChild(name);
        link.appendChild(iconContainer);
        link.appendChild(nameContainer);
        formItem.appendChild(link);
        formsContainer.appendChild(formItem);
    });
}
