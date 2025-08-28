var displayed = false;

let prohibitcontent = false;
let removedSubjects = JSON.parse(localStorage.getItem('removedSubjects')) || [];

function injectCSS() {
    if(displayed){
        return;
    } 
    document.getElementById('course').innerHTML = "";
    const style = document.createElement('style');
    style.textContent = `
#course {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    gap: 2rem;
}

#semester-selection-container {
    width: 100%;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    box-sizing: border-box;
    box-shadow: var(--shadow-lg);
    transition: var(--transition-normal);
}

#semester-selection-container:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-2px);
}

#semester-selection {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
}

.semester-button {
    padding: 1rem 1.5rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    cursor: pointer;
    transition: var(--transition-normal);
    font-weight: 500;
    color: var(--text-secondary);
    position: relative;
    overflow: hidden;
    min-width: 120px;
    text-align: center;
}

.semester-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    opacity: 0;
    transition: var(--transition-normal);
    z-index: -1;
}

.semester-button:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
}

.semester-button:hover::before {
    opacity: 0.1;
}

.semester-button.active {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    border-color: var(--primary-color);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.action-buttons {
    display: flex;
    gap: 1rem;
    margin-left: auto;
    flex-shrink: 0;
}

.styled-button {
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: var(--radius-lg);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-normal);
    box-shadow: var(--shadow-md);
    color: white;
    position: relative;
    overflow: hidden;
    min-width: 140px;
    text-align: center;
    flex-shrink: 0;
}

.styled-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: var(--transition-fast);
}

.styled-button:hover::before {
    left: 100%;
}

.styled-button:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
}

.styled-button:active {
    transform: translateY(-1px);
}

.add-subject-button {
    background: linear-gradient(135deg, var(--success-color), #059669);
}

.add-subject-button:hover {
    background: linear-gradient(135deg, #059669, #047857);
}

.remove-subject-button {
    background: linear-gradient(135deg, var(--error-color), #dc2626);
}

.remove-subject-button:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.subject-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    box-sizing: border-box;
}

.subject-list[style*="display: flex"] {
    display: grid !important;
}

.subject-list[style*="display: none"] {
    display: none !important;
}

.subject {
    cursor: pointer;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    background: white;
    box-sizing: border-box;
    transition: var(--transition-normal);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    font-weight: 500;
    text-align: center;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    word-wrap: break-word;
    hyphens: auto;
    line-height: 1.4;
}

.subject::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
    transform: scaleX(0);
    transition: var(--transition-normal);
}

.subject:hover::before {
    transform: scaleX(1);
}

.subject:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-light);
}

.remove-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--error-color), #dc2626);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    font-size: 18px;
    font-weight: bold;
    transition: var(--transition-normal);
    z-index: 10;
}

.remove-icon::before {
    content: '×';
}

.remove-icon:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: scale(1.15) rotate(90deg);
    box-shadow: var(--shadow-lg);
}

.semester-sem1 {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border-left: 4px solid #ef4444;
}

.semester-sem2 {
    background: linear-gradient(135deg, #fff7ed, #fed7aa);
    border-left: 4px solid #f97316;
}

.semester-sem3 {
    background: linear-gradient(135deg, #fefce8, #fef08a);
    border-left: 4px solid #eab308;
}

.semester-sem4 {
    background: linear-gradient(135deg, #f0fdf4, #bbf7d0);
    border-left: 4px solid #22c55e;
}

.semester-sem5 {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border-left: 4px solid #3b82f6;
}

.semester-sem6 {
    background: linear-gradient(135deg, #f5f3ff, #e0e7ff);
    border-left: 4px solid #8b5cf6;
}

.semester-sem7 {
    background: linear-gradient(135deg, #fdf2f8, #f9a8d4);
    border-left: 4px solid #ec4899;
}

.popup, .popup2 {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.popup-content, .popup2-content {
    background: white;
    padding: 2rem;
    border-radius: var(--radius-xl);
    width: 90%;
    max-width: 500px;
    position: relative;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-color);
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.popup2-content {
    width: 400px;
    height: 500px;
    max-height: 80vh;
}

.popup2-content .styled-button {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    margin-top: 1rem;
    width: 100%;
}

.popup-close, .popup2-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    font-size: 24px;
    cursor: pointer;
    background: var(--bg-tertiary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-fast);
    color: var(--text-muted);
}

.popup-close:hover, .popup2-close:hover {
    background: var(--error-color);
    color: white;
    transform: rotate(90deg);
}

.popup2-content h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    color: var(--text-primary);
    font-weight: 600;
}

.scrollable-container {
    max-height: calc(100% - 120px);
    overflow-y: auto;
    padding-right: 0.5rem;
}

.scrollable-container::-webkit-scrollbar {
    width: 6px;
}

.scrollable-container::-webkit-scrollbar-track {
    background: var(--bg-tertiary);
    border-radius: 3px;
}

.scrollable-container::-webkit-scrollbar-thumb {
    background: var(--secondary-color);
    border-radius: 3px;
}

.scrollable-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
}

.removed-subject-list {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.removed-subject-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    transition: var(--transition-fast);
}

.removed-subject-item:hover {
    background: var(--bg-tertiary);
    transform: translateX(5px);
}

.removed-subject-item input[type="checkbox"] {
    margin-right: 0.75rem;
    transform: scale(1.2);
    accent-color: var(--primary-color);
}

.removed-subject-item label {
    color: var(--text-primary);
    font-weight: 500;
    cursor: pointer;
    flex: 1;
}

#breadcrumb-nav {
    padding: 1rem 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

#breadcrumb-nav a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);
}

#breadcrumb-nav a:hover {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary-dark);
}

#subject-content h2 {
    color: var(--text-primary);
    font-size: 2rem;
    margin-bottom: 2rem;
    font-weight: 600;
    text-align: center;
}

.detail-content {
    padding: 1rem;
}

.detail-content .container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.detail-content .item-container {
    background: white;
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    transition: var(--transition-normal);
    display: flex;
    flex-direction: column;
}

.detail-content .item-container:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.detail-content .item-container h3 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
}

.detail-content .item-container a {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    text-decoration: none;
    border-radius: var(--radius-md);
    font-weight: 500;
    transition: var(--transition-normal);
    text-align: center;
    margin-top: auto;
}

.detail-content .item-container a:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.video-note {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
    border-left: 4px solid var(--warning-color);
    padding: 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 2rem;
    color: var(--text-primary);
}

.video-note p {
    margin: 0;
    font-weight: 500;
}

.video-note strong {
    color: var(--warning-color);
}

.video-container {
    margin-bottom: 2rem;
}

.video-item {
    display: flex;
    gap: 1.5rem;
    background: white;
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
    transition: var(--transition-normal);
}

.video-item:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.video-item iframe {
    border-radius: var(--radius-md);
    flex: 0 0 400px;
    height: 225px;
    border: none;
}

.video-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.video-title {
    margin-bottom: 0.75rem;
}

.video-title a {
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
    text-decoration: none;
    transition: var(--transition-fast);
}

.video-title a:hover {
    color: var(--primary-color);
}

.video-description {
    color: var(--text-secondary);
    line-height: 1.5;
    margin-top: 0.5rem;
}

.details-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.detail-item {
    background: white;
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    transition: var(--transition-normal);
    cursor: pointer;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.detail-item:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-light);
}

.detail-icon {
    width: 64px;
    height: 64px;
    object-fit: contain;
    margin-bottom: 1rem;
}

.detail-item p {
    margin: 0;
    font-weight: 500;
    color: var(--text-primary);
}

@media (max-width: 768px) {
    #course {
        padding: 1rem;
        gap: 1rem;
    }
    
    #semester-selection-container {
        padding: 1.5rem;
    }

#semester-selection {
    flex-direction: column;
    align-items: center;
}
    .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1rem;
    }

    
    .semester-button {
        width: 100%;
        max-width: 200px;
    }
    
    .subject-list {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
    }
    
    .action-buttons {
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
    
    .styled-button {
        width: 100%;
        max-width: 200px;
    }
    
    .popup2-content {
        width: 95%;
        height: 80vh;
        margin: 1rem;
    }
    
    .video-item {
        flex-direction: column;
        text-align: center;
    }
    
    .video-item iframe {
        width: 100%;
        max-width: 400px;
        height: 225px;
        flex: none;
    }
    
    .video-info {
        margin-left: 0;
        margin-top: 1rem;
        text-align: center;
    }
    
    .detail-content .container {
        grid-template-columns: 1fr;
    }
    
    .details-container {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
}

#semester-selection-container > div {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

#semester-selection-area {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 250px;
    max-width: 400px;
}

@media (max-width: 768px) {
    .action-buttons {
        margin-left: 0;
        width: 100%;
        justify-content: center;
    }
    
    #semester-selection-container > div {
        flex-direction: column;
    }
}

@media (max-width: 480px) {
    .action-buttons {
        flex-direction: column;
        align-items: stretch;
    }
    
    .styled-button {
        width: 100%;
        margin-bottom: 0.5rem;
    }
}

@media (max-width: 480px) {
    .subject {
        padding: 1rem;
        min-height: 100px;
    }
    
    #subject-content h2 {
        font-size: 1.5rem;
    }
    
    .video-item iframe {
        height: 200px;
    }
    
    .action-buttons {
        gap: 0.75rem;
    }
    
    .detail-icon {
        width: 48px;
        height: 48px;
    }
    
    .details-container {
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
}
    `;
    document.head.appendChild(style);
}
let removeMode = false;

function initializeSemesterSelection() {
    if(displayed){
        return;
    }
    displayed = true;
    
    const courseContainer = document.getElementById('course');
    
    const selectionContainer = document.createElement('div');
    selectionContainer.id = 'semester-selection-container';

    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'flex-start';
    headerContainer.style.width = '100%';
    headerContainer.style.marginBottom = '1.5rem';
    headerContainer.style.flexWrap = 'wrap';
    headerContainer.style.gap = '1rem';

    const selectionArea = document.createElement('div');
    selectionArea.id = 'semester-selection-area';

    const label = document.createElement('div');
    label.textContent = 'Select Semesters';
    label.style.fontWeight = '600';
    label.style.color = 'var(--text-primary)';
    label.style.marginBottom = '0.5rem';

    const selectionBox = document.createElement('div');
    selectionBox.id = 'semester-selection-box';
    selectionBox.style.display = 'flex';
    selectionBox.style.flexWrap = 'wrap';
    selectionBox.style.gap = '0.5rem';
    selectionBox.style.padding = '0.75rem';
    selectionBox.style.border = '2px solid var(--border-color)';
    selectionBox.style.borderRadius = 'var(--radius-lg)';
    selectionBox.style.backgroundColor = 'var(--bg-primary)';
    selectionBox.style.cursor = 'pointer';
    selectionBox.style.minHeight = '50px';
    selectionBox.addEventListener('click', openSemesterPopup);

    selectionBox.addEventListener('mouseenter', () => {
        selectionBox.style.borderColor = 'var(--primary-color)';
        selectionBox.style.boxShadow = 'var(--shadow-sm)';
    });
    
    selectionBox.addEventListener('mouseleave', () => {
        selectionBox.style.borderColor = 'var(--border-color)';
        selectionBox.style.boxShadow = 'none';
    });

    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.classList.add('action-buttons');
    actionButtonsContainer.style.marginLeft = 'auto';
    actionButtonsContainer.style.alignSelf = 'center';

    const addButton = document.createElement('button');
    addButton.id = 'addbutton'; 
    addButton.textContent = 'Add Subject';
    addButton.classList.add('styled-button', 'add-subject-button');
    addButton.addEventListener('click', openAddSubjectPopup);

    const removeButton = document.createElement('button');
    removeButton.id = 'rmvbutton';
    removeButton.textContent = 'Remove Subject';
    removeButton.classList.add('styled-button', 'remove-subject-button');
    removeButton.addEventListener('click', () => {
        removeMode = !removeMode;
        updateSubjectList();
    });

    actionButtonsContainer.appendChild(addButton);
    actionButtonsContainer.appendChild(removeButton);
    
    selectionArea.appendChild(label);
    selectionArea.appendChild(selectionBox);
    
    headerContainer.appendChild(selectionArea);
    headerContainer.appendChild(actionButtonsContainer);
    
    selectionContainer.appendChild(headerContainer);
    courseContainer.appendChild(selectionContainer);

    const subjectList = document.createElement('div');
    subjectList.classList.add('subject-list');
    courseContainer.appendChild(subjectList);

    updateSemesterSelectionBox();
    updateSubjectList();
}

function updateSemesterSelectionBox() {
    const selectionBox = document.getElementById('semester-selection-box');
    if (!selectionBox) return;
    
    selectionBox.innerHTML = '';
    
    const selectedSemesters = getSelectedSemesters();
    
    if (selectedSemesters.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.textContent = 'Tap to select semesters';
        placeholder.style.color = 'var(--text-muted)';
        placeholder.style.fontStyle = 'italic';
        selectionBox.appendChild(placeholder);
    } else {
        selectedSemesters.forEach(semesterId => {
            const semester = courseData.semesters.find(sem => sem.id === semesterId);
            if (semester) {
                const badge = document.createElement('div');
                badge.classList.add('semester-badge');
                badge.style.padding = '0.4rem 0.8rem';
                badge.style.borderRadius = 'var(--radius-full)';
                badge.style.fontSize = '0.85rem';
                badge.style.fontWeight = '600';
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.gap = '0.4rem';
                
                const dot = document.createElement('span');
                dot.style.width = '10px';
                dot.style.height = '10px';
                dot.style.borderRadius = '50%';
                dot.style.display = 'inline-block';
                
                switch(semesterId) {
                    case 'sem1':
                        badge.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        badge.style.color = '#dc2626';
                        dot.style.backgroundColor = '#dc2626';
                        break;
                    case 'sem2':
                        badge.style.backgroundColor = 'rgba(249, 115, 22, 0.15)';
                        badge.style.color = '#ea580c';
                        dot.style.backgroundColor = '#ea580c';
                        break;
                    case 'sem3':
                        badge.style.backgroundColor = 'rgba(234, 179, 8, 0.15)';
                        badge.style.color = '#ca8a04';
                        dot.style.backgroundColor = '#ca8a04';
                        break;
                    case 'sem4':
                        badge.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
                        badge.style.color = '#16a34a';
                        dot.style.backgroundColor = '#16a34a';
                        break;
                    case 'sem5':
                        badge.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                        badge.style.color = '#2563eb';
                        dot.style.backgroundColor = '#2563eb';
                        break;
                    case 'sem6':
                        badge.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                        badge.style.color = '#7c3aed';
                        dot.style.backgroundColor = '#7c3aed';
                        break;
                    case 'sem7':
                        badge.style.backgroundColor = 'rgba(236, 72, 153, 0.15)';
                        badge.style.color = '#db2777';
                        dot.style.backgroundColor = '#db2777';
                        break;
                    default:
                        badge.style.backgroundColor = 'rgba(156, 163, 175, 0.15)';
                        badge.style.color = '#6b7280';
                        dot.style.backgroundColor = '#6b7280';
                }
                
                const removeBtn = document.createElement('span');
                removeBtn.innerHTML = '&times;';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.marginLeft = '0.3rem';
                removeBtn.style.fontSize = '1.1rem';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    const updatedSelection = selectedSemesters.filter(id => id !== semesterId);
                    localStorage.setItem('selectedSemesters', JSON.stringify(updatedSelection));
                    
                    updateSemesterSelectionBox();
                    updateSubjectList();
                });
                
                const semesterText = document.createTextNode(
                    semester.name.replace('Semester', 'Sem').replace(' ', '')
                );
                
                badge.appendChild(dot);
                badge.appendChild(semesterText);
                badge.appendChild(removeBtn);
                selectionBox.appendChild(badge);
            }
        });
    }
}

function updateSemesterBadge(badgeElement) {
    const selectedSemesters = getSelectedSemesters();
    
    if (selectedSemesters.length === 0) {
        badgeElement.textContent = 'None';
        badgeElement.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    } else if (selectedSemesters.length === courseData.semesters.length) {
        badgeElement.textContent = 'All';
        badgeElement.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
    } else {
        badgeElement.textContent = `${selectedSemesters.length} selected`;
        badgeElement.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    }
}

function saveSemesterSelection() {
    const checkboxes = document.querySelectorAll('#semester-popup input[type="checkbox"]');
    const selectedSemesters = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedSemesters.push(checkbox.value);
        }
    });
    
    if (selectedSemesters.length === 0) {
        selectedSemesters.push('sem7');
    }
    
    localStorage.setItem('selectedSemesters', JSON.stringify(selectedSemesters));
    
    updateSemesterSelectionBox();
}

const additionalStyles = `
#semester-selection-box {
    transition: all 0.3s ease;
}

.semester-badge {
    transition: all 0.2s ease;
}

.semester-badge:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

@media (max-width: 768px) {
    #semester-selection-container > div {
        flex-direction: column;
    }
    
    .action-buttons {
        width: 100%;
        justify-content: center;
        margin-top: 1rem;
    }
    
    #semester-selection-box {
        min-height: 44px;
    }
}

@media (max-width: 480px) {
    .action-buttons {
        flex-direction: column;
        align-items: stretch;
    }
    
    .styled-button {
        width: 100%;
        margin-bottom: 0.5rem;
    }
}
`;

const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);

function openSemesterPopup() {
    const popup = document.createElement('div');
    popup.id = 'semester-popup';
    popup.classList.add('popup2');

    const popupContent = document.createElement('div');
    popupContent.classList.add('popup2-content');

    const closeButton = document.createElement('span');
    closeButton.classList.add('popup2-close');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => {
        const selectedCheckboxes = document.querySelectorAll('#semester-popup input[type="checkbox"]:checked');
        if (selectedCheckboxes.length === 0) {
            localStorage.setItem('selectedSemesters', JSON.stringify(['sem7']));
        }
        popup.remove();
        updateSubjectList();
    });

    popupContent.appendChild(closeButton);

    const title = document.createElement('h2');
    title.textContent = 'Select Semesters';
    popupContent.appendChild(title);

    const semesterListContainer = document.createElement('div');
    semesterListContainer.classList.add('scrollable-container');
    
    const selectedSemesters = getSelectedSemesters();
    
    courseData.semesters.forEach(semester => {
        const semesterItem = document.createElement('div');
        semesterItem.classList.add('removed-subject-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `semester-${semester.id}`;
        checkbox.value = semester.id;
        checkbox.checked = selectedSemesters.includes(semester.id);

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = semester.name;

        semesterItem.appendChild(checkbox);
        semesterItem.appendChild(label);
        semesterListContainer.appendChild(semesterItem);
    });

    popupContent.appendChild(semesterListContainer);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Selection';
    saveButton.classList.add('styled-button');
    saveButton.addEventListener('click', () => {
        saveSemesterSelection();
        popup.remove();
        updateSubjectList();
    });

    popupContent.appendChild(saveButton);

    popup.appendChild(popupContent);

    document.body.appendChild(popup);
} 

function isSemesterSelected(semesterId) {
    const selectedSemesters = getSelectedSemesters();
    return selectedSemesters.includes(semesterId);
}

function getSelectedSemesters() {
    const storedSemesters = localStorage.getItem('selectedSemesters');
    return storedSemesters ? JSON.parse(storedSemesters) : ['sem7'];
}

function saveSelectedSemesters() {
    const selectedSemesters = Array.from(document.querySelectorAll('.semester-button.active'))
        .map(button => button.dataset.id);

    localStorage.setItem('selectedSemesters', JSON.stringify(selectedSemesters));
}

function saveRemovedSubjects() {
    localStorage.setItem('removedSubjects', JSON.stringify(removedSubjects));
}

function updateSubjectList() {
    const subjectList = document.querySelector('.subject-list');
    if (!subjectList) return;

    subjectList.innerHTML = '';

    const selectedSemesters = getSelectedSemesters();
    if (selectedSemesters.length === 0) {
        selectedSemesters.push('sem7');
    }

    selectedSemesters.forEach(semesterId => {
        const semester = courseData.semesters.find(sem => sem.id === semesterId);
        if (semester) {
            semester.subjects.forEach(subjectName => {
                if (removedSubjects.includes(subjectName.name)) return;

                const subjectDiv = document.createElement('div');
                subjectDiv.textContent = subjectName.name;
                subjectDiv.classList.add('subject', `semester-${semesterId}`);

                if (removeMode) {
                    const removeButton = document.createElement('div');
                    removeButton.classList.add('remove-icon');
                    removeButton.addEventListener('click', () => {
                        removedSubjects.push(subjectName.name);
                        saveRemovedSubjects();
                        subjectDiv.remove();
                        removeMode = !removeMode;
                        updateSubjectList();
                        prohibitcontent = true;
                    });
                    subjectDiv.appendChild(removeButton);
                }

                subjectDiv.addEventListener('click', () => {
                    if (!prohibitcontent) {
                        showSubjectPopup(subjectName);
                    } else {
                        prohibitcontent = false;
                    }
                });

                subjectList.appendChild(subjectDiv);
            });
        }
    });
}

function openAddSubjectPopup() {
    const popup = document.createElement('div');
    popup.id = 'add-subject-popup2';
    popup.classList.add('popup2');

    const popupContent = document.createElement('div');
    popupContent.classList.add('popup2-content');

    const closeButton = document.createElement('span');
    closeButton.classList.add('popup2-close');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => {
        popup.remove();
    });

    popupContent.appendChild(closeButton);

    const title = document.createElement('h2');
    title.textContent = 'Add Subjects';
    popupContent.appendChild(title);

    const subjectListContainer = document.createElement('div');
    subjectListContainer.classList.add('scrollable-container');
    
    const removedSubjectList = document.createElement('div');
    removedSubjectList.classList.add('removed-subject-list');
    removedSubjects.forEach(subject => {
        const subjectItem = document.createElement('div');
        subjectItem.classList.add('removed-subject-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `restore-${subject}`;
        checkbox.value = subject;

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = subject;

        subjectItem.appendChild(checkbox);
        subjectItem.appendChild(label);
        removedSubjectList.appendChild(subjectItem);
    });

    subjectListContainer.appendChild(removedSubjectList);
    popupContent.appendChild(subjectListContainer);

    const addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.classList.add('styled-button');
    addButton.addEventListener('click', () => {
        addSelectedSubjects();
        popup.remove();
    });

    popupContent.appendChild(addButton);

    popup.appendChild(popupContent);

    document.body.appendChild(popup);
}

function addSelectedSubjects() {
    const checkboxes = document.querySelectorAll('#add-subject-popup2 .removed-subject-item input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const subjectName = checkbox.value;
            removedSubjects = removedSubjects.filter(subject => subject !== subjectName);
            saveRemovedSubjects();
        }
    });
    updateSubjectList();
}

function showSubjectPopup(subjectName) {
    if(removeMode){
        return;
    } document.getElementById("rmvbutton").style.display = "none";
    document.getElementById("addbutton").style.display = "none";
    document.getElementById("semester-selection-container").style.display = "none";
    
    if (subjectName.hasOwnProperty('url') && subjectName.url) {
        window.open(subjectName.url, '_blank');
        return;
    }

    const subject = courseData.semesters
        .flatMap(sem => sem.subjects)
        .find(sub => sub.name === subjectName.name);

    if (subject && subject.details) {
        const subjectList = document.querySelector('.subject-list');
        subjectList.style.display = 'none';

        const courseContainer = document.getElementById('course');

        const breadcrumbNav = document.createElement('div');
        breadcrumbNav.id = 'breadcrumb-nav';
        breadcrumbNav.style.marginLeft = '20px';
        breadcrumbNav.innerHTML = `
            <a href="#" id="course-link">Course</a> > 
            <a href="#" id="subject-link">${subjectName.name}</a>
        `;

        breadcrumbNav.querySelector('#course-link').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('#subject-content')?.remove();
            document.querySelector('#breadcrumb-nav')?.remove();
            subjectList.style.display = 'flex';
            document.getElementById("rmvbutton").style.display = "";
            document.getElementById("addbutton").style.display = "";
            document.getElementById("semester-selection-container").style.display = "";
        });

        breadcrumbNav.querySelector('#subject-link').addEventListener('click', (e) => {
            e.preventDefault();
            showSubjectContent(subject);
        });

        const subjectContent = document.createElement('div');
        subjectContent.id = 'subject-content';
        subjectContent.style.marginLeft = '20px';
        subjectContent.innerHTML = `<h2>${subjectName.name}</h2>`;

        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('details-container');

        Object.keys(subject.details).forEach(detailName => {
            const detailDiv = document.createElement('div');
            detailDiv.classList.add('detail-item');

            let iconUrl = '';
            if (detailName.includes('Syllabus')) {
                iconUrl = "https://static.vecteezy.com/system/resources/previews/014/636/881/non_2x/syllabus-clipboard-icon-flat-style-vector.jpg";
            } else if (detailName.includes('Book')) {
                iconUrl = "https://t4.ftcdn.net/jpg/05/07/19/83/360_F_507198344_PPZmZ0ShfTohJBPUv7Dh0ATswkJrPjtr.jpg";
            } else if (detailName.includes('Online') || detailName.includes('NPTEL Dashboard') || detailName.includes('Website') || detailName.toLowerCase().includes('question')) {
                iconUrl = "https://i.pinimg.com/564x/4b/b0/37/4bb037397915f5efa68fdd79b604b822.jpg";
            } else if (detailName === 'Tutorials') {
                iconUrl = "https://ift.world/wp-content/uploads/2017/01/wsi-imageoptim-q-bank-300x300.png";
            } else if (detailName === 'Labs') {
                iconUrl = "https://cdn-icons-png.flaticon.com/512/2393/2393574.png";
            } else if (detailName.includes('Study Material') && !detailName.includes('Online') || detailName.includes('Content')) {
                iconUrl = "https://cdn-icons-png.flaticon.com/512/1089/1089109.png";
            } else if (detailName.includes('Project') || detailName.includes('Literature Survey Folder')) {
                iconUrl = "https://static-00.iconduck.com/assets.00/folder-icon-256x204-0171zqe6.png";
            } else if (detailName === 'Class Notebook') {
                iconUrl = "https://static.vecteezy.com/system/resources/previews/027/179/341/original/microsoft-one-note-icon-logo-symbol-free-png.png";
            } else if (detailName === 'Evaluation Sheet') {
                iconUrl = "https://cdn-icons-png.flaticon.com/512/5361/5361284.png";
            } else if (detailName.toLowerCase().includes('ppt')) {
                iconUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsdPmt20JSFqweGX13Ib7KM5xbeWFqXCfuog&s";
            } else if (detailName.includes('About Course') || detailName.includes("Outcome") || detailName.toLowerCase().includes("description")) {
                iconUrl = "https://cdn.pixabay.com/photo/2016/06/15/15/02/info-1459077_1280.png";
            } else if (detailName === 'Videos') {
                iconUrl = "https://cdn-icons-png.freepik.com/256/1324/1324244.png?semt=ais_hybrid";
            } else if (detailName === 'Courses' || detailName.toLowerCase().includes('topic') || detailName.toLowerCase().includes('plan') ) {
                iconUrl = "https://cdn-icons-png.flaticon.com/256/1903/1903172.png";
            } else if (detailName.toLowerCase().includes('assignment')) {
                iconUrl = "https://cdn-icons-png.flaticon.com/512/5842/5842026.png";
            } else {
                iconUrl = "https://i.pinimg.com/originals/c0/f6/c9/c0f6c97d6669e7bfb41727e884aeb801.png";
            }

            detailDiv.innerHTML = `
                <img src="${iconUrl}" alt="${detailName}" class="detail-icon" />
                <p>${detailName}</p>
            `;
            detailDiv.addEventListener('click', () => showDetailContent(detailName, subject.details[detailName]));

            detailsContainer.appendChild(detailDiv);
        });

        subjectContent.appendChild(detailsContainer);
        courseContainer.appendChild(breadcrumbNav);
        courseContainer.appendChild(subjectContent);
    }
}

function showSubjectContent(subject) {
    if (!subject || !subject.details) return;

    const subjectList = document.querySelector('.subject-list');
    if (subjectList) subjectList.style.display = 'none';

    const courseContainer = document.getElementById('course');

    document.querySelector('#subject-content')?.remove();
    document.querySelector('#breadcrumb-nav')?.remove();

    const breadcrumbNav = document.createElement('div');
    breadcrumbNav.id = 'breadcrumb-nav';
    breadcrumbNav.style.marginLeft = '20px';
    breadcrumbNav.innerHTML = `
        <a href="#" id="course-link">Course</a> > 
        <a href="#" id="subject-link">${subject.name}</a>
    `;
    
    breadcrumbNav.querySelector('#course-link').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#subject-content')?.remove();
        document.querySelector('#breadcrumb-nav')?.remove();
        subjectList.style.display = 'flex';
        document.getElementById("rmvbutton").style.display = "";
        document.getElementById("addbutton").style.display = "";
        document.getElementById("semester-selection-container").style.display = "";
    });

    breadcrumbNav.querySelector('#subject-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSubjectContent(subject);
    });

    const subjectContent = document.createElement('div');
    subjectContent.id = 'subject-content';    
    subjectContent.style.marginLeft = '20px';
    subjectContent.innerHTML = `<h2>${subject.name}</h2>`;

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('details-container');
    
    Object.keys(subject.details).forEach(detailName => {
        const detailDiv = document.createElement('div');
        detailDiv.classList.add('detail-item');

        let iconUrl = '';
        if (detailName.includes('Syllabus')) {
            iconUrl = "https://static.vecteezy.com/system/resources/previews/014/636/881/non_2x/syllabus-clipboard-icon-flat-style-vector.jpg";
        } else if (detailName.includes('Books')) {
            iconUrl = "https://t4.ftcdn.net/jpg/05/07/19/83/360_F_507198344_PPZmZ0ShfTohJBPUv7Dh0ATswkJrPjtr.jpg";
        } else if (detailName.includes('Online') || detailName.includes('NPTEL Dashboard') || detailName.includes('Website')) {
            iconUrl = "https://i.pinimg.com/564x/4b/b0/37/4bb037397915f5efa68fdd79b604b822.jpg";
        } else if (detailName === 'Tutorials') {
            iconUrl = "https://ift.world/wp-content/uploads/2017/01/wsi-imageoptim-q-bank-300x300.png";
        } else if (detailName === 'Labs') {
            iconUrl = "https://cdn-icons-png.flaticon.com/512/2393/2393574.png";
        } else if (detailName.includes('Study Material') && !detailName.includes('Online')) {
            iconUrl = "https://cdn-icons-png.flaticon.com/512/1089/1089109.png";
        } else if (detailName.includes('Project') || detailName.includes('Literature Survey Folder')) {
            iconUrl = "https://static-00.iconduck.com/assets.00/folder-icon-256x204-0171zqe6.png";
        } else if (detailName === 'Class Notebook') {
            iconUrl = "https://static.vecteezy.com/system/resources/previews/027/179/341/original/microsoft-one-note-icon-logo-symbol-free-png.png";
        } else if (detailName === 'Evaluation Sheet') {
            iconUrl = "https://cdn-icons-png.flaticon.com/512/5361/5361284.png";
        } else if (detailName.includes('ppt')) {
            iconUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsdPmt20JSFqweGX13Ib7KM5xbeWFqXCfuog&s";
        } else if (detailName.includes('About Course')) {
            iconUrl = "https://cdn.pixabay.com/photo/2016/06/15/15/02/info-1459077_1280.png";
        } else if (detailName === 'Videos') {
            iconUrl = "https://cdn-icons-png.freepik.com/256/1324/1324244.png?semt=ais_hybrid";
        } else {
            iconUrl = "https://i.pinimg.com/originals/c0/f6/c9/c0f6c97d6669e7bfb41727e884aeb801.png";
        }

        detailDiv.innerHTML = `
            <img src="${iconUrl}" alt="${detailName}" class="detail-icon" />
            <p>${detailName}</p>
        `;
        detailDiv.addEventListener('click', () => showDetailContent(detailName, subject.details[detailName]));

        detailsContainer.appendChild(detailDiv);
    });

    subjectContent.appendChild(detailsContainer);
    courseContainer.appendChild(breadcrumbNav);
    courseContainer.appendChild(subjectContent);
}

function showDetailContent(detailName, detailValues) {
    const subjectContent = document.querySelector('#subject-content');
    subjectContent.style.marginLeft = '20px';
    const breadcrumbNav = document.querySelector('#breadcrumb-nav');
    breadcrumbNav.style.marginLeft = '20px';

    if (typeof detailValues === 'object' && detailValues !== null) {
        const keys = Object.keys(detailValues);
        if (keys.length === 1 && typeof detailValues[keys[0]] === 'string' && detailValues[keys[0]].includes('http')) {
            window.open(detailValues[keys[0]], '_blank');
            return;
        }
    }

    breadcrumbNav.innerHTML = `
        <a href="#" id="course-link">Course</a> > 
        <a href="#" id="subject-link">${breadcrumbNav.querySelector('#subject-link')?.textContent || ''}</a> > 
        ${detailName}
    `;

    breadcrumbNav.querySelector('#course-link').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#subject-content').remove();
        document.querySelector('#breadcrumb-nav').remove();
        document.querySelector('.subject-list').style.display = 'flex';
        document.getElementById("rmvbutton").style.display = "";
        document.getElementById("addbutton").style.display = "";
        document.getElementById("semester-selection-container").style.display = "";
    });

    breadcrumbNav.querySelector('#subject-link').addEventListener('click', (e) => {
        e.preventDefault();
        const subjectName = breadcrumbNav.querySelector('#subject-link').textContent;
        showSubjectContent(courseData.semesters
            .flatMap(sem => sem.subjects)
            .find(sub => sub.name === subjectName));
    });

    subjectContent.innerHTML = `<h2>${detailName}</h2>`;

    const detailContent = document.createElement('div');
    detailContent.classList.add('detail-content');
    detailContent.style.marginLeft = '20px';

    const itemsContainer = document.createElement('div');
    itemsContainer.classList.add('container');
    detailContent.appendChild(itemsContainer);
    
    if (detailName === "Videos") {
        const note = document.createElement('div');
        note.classList.add('video-note');
        note.innerHTML = `
            <p><strong>Note:</strong> The study videos here may miss or cover an extra topic, so it is advised to have a look over the syllabus and notes as well.</p>
        `;
        detailContent.appendChild(note);
    } else if (detailName === "Syllabus") {
        const note = document.createElement('div');
        note.classList.add('video-note');
        note.innerHTML = `
            <p><strong>Note:</strong> The syllabus here may miss or cover an extra topic, so it is advised to have a look over the notes as well.</p>
        `;
        detailContent.appendChild(note);
    }

    if (typeof detailValues === 'string') {    
        detailValues = detailValues.replace(/\/bold (.*?) bold\//g, "<strong>$1</strong>");
        detailValues = detailValues.replace(/\\n/g, '<br>');
        detailValues = detailValues.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        detailContent.innerHTML += `<p>${detailValues}</p>`;
    } else if (typeof detailValues === 'object' && detailValues !== null) {

        for (const key in detailValues) {
            if (detailValues.hasOwnProperty(key)) {
                const value = detailValues[key];
                if(typeof value === 'string' && value.includes('youtube.com/embed/')) {
                    const [title, description] = key.split('/desc');
                    const videoContainer = document.createElement('div');
                    videoContainer.classList.add('video-container');
                    videoContainer.innerHTML = `
                    <div class="video-item">
                        <iframe src="${value}" allowfullscreen></iframe>
                        <div class="video-info">
                            <div class="video-title">
                                <a href="${value.replace('/embed/videoseries', '/playlist')}" target="_blank" rel="noopener noreferrer" style="color: #1e90ff; text-decoration: none;">
                                    ${title.trim()}
                                </a>
                            </div>
                            ${description ? `<div class="video-description">${description.trim()}</div>` : ''}
                        </div>
                    </div>
                    `;
                    detailContent.appendChild(videoContainer);
                } else if(typeof value === 'string') {
                    const itemContainer = document.createElement('div');
                    itemContainer.classList.add('item-container');
                    itemContainer.innerHTML = `
                        <h3>${key}</h3>
                        <a href="${value}" target="_blank">Open Link</a>
                    `;
                    itemsContainer.appendChild(itemContainer);
                } else if (typeof value === 'object' && value.file) {
                    if (value.file.includes('youtube.com/embed/')) {
                        const [title, description] = key.split('/desc');
                        const videoContainer = document.createElement('div');
                        videoContainer.classList.add('video-container');
                        videoContainer.innerHTML = `
                            <iframe src="${value.file}" allowfullscreen></iframe>
                            <div class="video-info">
                                <div class="video-title">
                                    <a href="${value.replace('/embed/videoseries', '/playlist')}" target="_blank" rel="noopener noreferrer" style="color: #1e90ff; text-decoration: none;">
                                        ${title.trim()}
                                    </a>
                                </div>
                                ${description ? `<div class="video-description">${description.trim()}</div>` : ''}
                            </div>

                        `;
                        detailContent.appendChild(videoContainer);
                    } else {
                        const itemContainer = document.createElement('div');
                        itemContainer.classList.add('item-container');
                        itemContainer.innerHTML = `
                            <h3>${key}</h3>
                            <a href=${value.file} target="_blank" rel="noopener noreferrer">
            ${title.trim()}
        </a>
                        `;
                        itemsContainer.appendChild(itemContainer);
                    }
                }
            }
        }
    } else {
        detailContent.innerHTML += `<p>Unexpected content type: ${typeof detailValues}</p>`;
    }

    subjectContent.appendChild(detailContent);
}