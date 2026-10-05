document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("notes-container");
    const searchInput = document.getElementById("search-input");
    const groupDomainCheckbox = document.getElementById("group-domain");
    
    let allNotes = [];

    chrome.storage.local.get(null, (items) => {
        allNotes = Object.values(items).filter(n => n.content && n.url);
        
        allNotes.forEach(note => {
            if (!note.timestamp) note.timestamp = 0; 
        });
        
        renderNotes();
    });

    searchInput.addEventListener("input", renderNotes);
    groupDomainCheckbox.addEventListener("change", renderNotes);

    function getDomain(urlStr) {
        try {
            return new URL(urlStr).hostname;
        } catch(e) {
            return 'Unknown';
        }
    }

    function renderNotes() {
        container.innerHTML = '';
        
        const query = searchInput.value.toLowerCase().trim();
        const groupByDomain = groupDomainCheckbox.checked;

        let filtered = [...allNotes];
        if (query) {
            filtered = filtered.filter(note => 
                note.content.toLowerCase().includes(query) || 
                note.url.toLowerCase().includes(query)
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">No notes found.</div>';
            return;
        }

        if (groupByDomain) {
            const groups = {};
            filtered.forEach(note => {
                const domain = getDomain(note.url);
                if (!groups[domain]) groups[domain] = [];
                groups[domain].push(note);
            });
            
            const domains = Object.keys(groups).sort();
            
            domains.forEach(domain => {
                const header = document.createElement("div");
                header.className = "domain-group-header";
                header.textContent = domain;
                container.appendChild(header);
                
                groups[domain].forEach(note => {
                    container.appendChild(createNoteElement(note));
                });
            });
        } else {
            filtered.forEach(note => {
                container.appendChild(createNoteElement(note));
            });
        }
    }

    function createNoteElement(noteData) {
        const noteEl = document.createElement("div");
        noteEl.className = "note-item";
        
        let displayUrl = noteData.url;
        try {
            const urlObj = new URL(noteData.url);
            displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
        } catch (e) {}

        noteEl.innerHTML = `
            <div class="note-content">${escapeHTML(noteData.content)}</div>
            <div class="note-url">${escapeHTML(displayUrl)}</div>
        `;
        
        noteEl.addEventListener("click", () => {
            chrome.tabs.create({ url: noteData.url });
        });
        
        return noteEl;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
