document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("notes-container");

    chrome.storage.local.get(null, (items) => {
        const notes = Object.values(items);
        
        if (notes.length === 0) {
            container.innerHTML = '<div class="empty-state">No notes found. Right-click on any page to add a note!</div>';
            return;
        }

        notes.forEach(noteData => {
            if (!noteData.content || !noteData.url) return;

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

            container.appendChild(noteEl);
        });
    });
});

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
