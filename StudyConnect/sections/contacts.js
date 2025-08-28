function populateContacts(contacts) {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
        document.head.appendChild(link);
    }

    const contactsContainer = document.getElementById('contacts');

    contactsContainer.style.display = 'flex';
    contactsContainer.style.flexWrap = 'wrap';
    contactsContainer.style.gap = '25px';
    contactsContainer.style.padding = '25px';
    contactsContainer.style.width = '100%';
    contactsContainer.style.boxSizing = 'border-box';
    contactsContainer.style.backgroundColor = '#f8fafc';
    contactsContainer.style.borderRadius = '12px';
    contactsContainer.style.justifyContent = 'center';
    contactsContainer.style.alignItems = 'flex-start';

    contactsContainer.innerHTML = '';

    contacts.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.style.display = 'flex';
        contactItem.style.flexDirection = 'column';
        contactItem.style.alignItems = 'center';
        contactItem.style.flex = '1 1 calc(25% - 25px)';
        contactItem.style.minWidth = '220px';
        contactItem.style.maxWidth = '260px';
        contactItem.style.padding = '20px';
        contactItem.style.background = 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';
        contactItem.style.borderRadius = '16px';
        contactItem.style.boxSizing = 'border-box';
        contactItem.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)';
        contactItem.style.transition = 'all 0.3s ease';
        contactItem.style.position = 'relative';
        contactItem.style.overflow = 'hidden';
        contactItem.style.borderTop = '4px solid #3b82f6';

        contactItem.onmouseover = function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)';
        };
        
        contactItem.onmouseout = function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)';
        };

        const avatar = document.createElement('div');
        avatar.style.width = '70px';
        avatar.style.height = '70px';
        avatar.style.borderRadius = '50%';
        avatar.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.color = 'white';
        avatar.style.fontSize = '24px';
        avatar.style.fontWeight = '600';
        avatar.style.marginBottom = '15px';
        avatar.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.3)';
        avatar.textContent = contact.name.split(' ').map(n => n[0]).join('').toUpperCase();

        const name = document.createElement('h4');
        name.textContent = contact.name;
        name.style.fontSize = '18px';
        name.style.fontWeight = '700';
        name.style.margin = '0 0 8px 0';
        name.style.color = '#1f2937';
        name.style.textAlign = 'center';
        name.style.letterSpacing = '0.3px';

        const staffRoom = document.createElement('p');
        staffRoom.textContent = `Room: ${contact.room}`;
        staffRoom.style.fontSize = '14px';
        staffRoom.style.color = '#6b7280';
        staffRoom.style.margin = '0 0 20px 0';
        staffRoom.style.textAlign = 'center';
        staffRoom.style.fontWeight = '500';
        staffRoom.style.padding = '6px 12px';
        staffRoom.style.background = '#f3f4f6';
        staffRoom.style.borderRadius = '20px';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '15px';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.width = '100%';

        const callButton = document.createElement('button');
        callButton.innerHTML = '<i class="fas fa-phone-alt"></i>';
        callButton.style.padding = '12px';
        callButton.style.width = '50px';
        callButton.style.height = '50px';
        callButton.style.border = 'none';
        callButton.style.borderRadius = '50%';
        callButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        callButton.style.color = '#fff';
        callButton.style.cursor = 'pointer';
        callButton.style.display = 'flex';
        callButton.style.alignItems = 'center';
        callButton.style.justifyContent = 'center';
        callButton.style.fontSize = '18px';
        callButton.style.boxShadow = '0 5px 15px rgba(16, 185, 129, 0.3)';
        callButton.style.transition = 'all 0.2s ease';

        callButton.onmouseover = function() {
            this.style.transform = 'scale(1.1) translateY(-3px)';
            this.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
        };
        
        callButton.onmouseout = function() {
            this.style.transform = 'scale(1) translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(16, 185, 129, 0.3)';
        };

        callButton.onclick = () => {
            window.location.href = `tel:${contact.phone}`;
        };

        const emailButton = document.createElement('button');
        emailButton.innerHTML = '<i class="fas fa-envelope"></i>';
        emailButton.style.padding = '12px';
        emailButton.style.width = '50px';
        emailButton.style.height = '50px';
        emailButton.style.border = 'none';
        emailButton.style.borderRadius = '50%';
        emailButton.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
        emailButton.style.color = '#fff';
        emailButton.style.cursor = 'pointer';
        emailButton.style.display = 'flex';
        emailButton.style.alignItems = 'center';
        emailButton.style.justifyContent = 'center';
        emailButton.style.fontSize = '18px';
        emailButton.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.3)';
        emailButton.style.transition = 'all 0.2s ease';

        emailButton.onmouseover = function() {
            this.style.transform = 'scale(1.1) translateY(-3px)';
            this.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
        };
        
        emailButton.onmouseout = function() {
            this.style.transform = 'scale(1) translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.3)';
        };

        emailButton.onclick = () => {
            window.location.href = `mailto:${contact.email}`;
        };

        buttonContainer.appendChild(callButton);
        buttonContainer.appendChild(emailButton);

        contactItem.appendChild(avatar);
        contactItem.appendChild(name);
        contactItem.appendChild(staffRoom);
        contactItem.appendChild(buttonContainer);

        contactsContainer.appendChild(contactItem);
    });
}
