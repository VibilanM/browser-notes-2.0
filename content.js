function createDragHandle(note) {
    const handle = document.createElement("div");

    handle.style.position = "absolute";
    handle.style.top = "12px";
    handle.style.left = "50%";
    handle.style.transform = "translateX(-50%)";
    handle.style.width = "12px";
    handle.style.height = "12px";
    handle.style.borderRadius = "50%";
    handle.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
    handle.style.cursor = "grab";
    handle.style.zIndex = "10000";
    handle.contentEditable = "false";
    handle.style.userSelect = "none";
    handle.style.pointerEvents = "auto";

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        handle.style.cursor = "grabbing";

        const noteRect = note.getBoundingClientRect();
        offsetX = e.clientX - noteRect.left;
        offsetY = e.clientY - noteRect.top;
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const newX = e.pageX - offsetX;
        const newY = e.pageY - offsetY;

        note.style.left = `${newX}px`;
        note.style.top = `${newY}px`;
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = "grab";
            saveNote(note);
        }
    });

    return handle;
}

function createDeleteButton(note) {
    const btn = document.createElement("img");
    btn.src = chrome.runtime.getURL("assets/delete.png");

    btn.style.position = "absolute";
    btn.style.top = "12px";
    btn.style.right = "12px";
    btn.style.width = "14px";
    btn.style.height = "14px";
    btn.style.cursor = "pointer";
    btn.style.opacity = "0.5";
    btn.style.transition = "opacity 0.2s";
    btn.contentEditable = "false";
    btn.style.userSelect = "none";
    btn.style.pointerEvents = "auto";

    btn.addEventListener("mouseenter", () => {
        btn.style.opacity = "1";
    });

    btn.addEventListener("mouseleave", () => {
        btn.style.opacity = "0.5";
    });

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm("Are you sure you want to delete this note?")) {
            chrome.storage.local.remove(note.dataset.id);
            note.remove();
        }
    });

    return btn;
}

function getNormalizedURL() {
    return window.location.origin + window.location.pathname + window.location.search;
}

function guardNoteControls(note, dragHandle, deleteBtn) {
    const observer = new MutationObserver(() => {
        if (!note.contains(dragHandle)) note.appendChild(dragHandle);
        if (!note.contains(deleteBtn)) note.appendChild(deleteBtn);
    });
    observer.observe(note, { childList: true });
}

function injectGlassStyles() {
    if (document.getElementById('_bn_glass_styles')) return;
    const style = document.createElement('style');
    style.id = '_bn_glass_styles';
    style.textContent = `
        [data-browser-note] {
            background: rgba(38, 38, 42, 0.55) !important;
            backdrop-filter: blur(40px) saturate(200%) brightness(1.1) !important;
            -webkit-backdrop-filter: blur(40px) saturate(200%) brightness(1.1) !important;
            border-radius: 28px !important;
            box-shadow:
                0 24px 64px rgba(0, 0, 0, 0.55),
                inset 0 1.5px 0 rgba(255, 255, 255, 0.28),
                inset 0 -1px 0 rgba(0, 0, 0, 0.25),
                inset 1px 0 0 rgba(255, 255, 255, 0.1),
                inset -1px 0 0 rgba(0, 0, 0, 0.12) !important;
            border: none !important;
            position: relative;
        }
        [data-browser-note]::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 28px;
            background: linear-gradient(
                150deg,
                rgba(255, 255, 255, 0.13) 0%,
                rgba(255, 255, 255, 0.05) 30%,
                rgba(255, 255, 255, 0.01) 55%,
                rgba(0, 0, 0, 0.04) 100%
            );
            pointer-events: none;
        }
        [data-browser-note]:hover {
            box-shadow:
                0 28px 72px rgba(0, 0, 0, 0.6),
                inset 0 1.5px 0 rgba(255, 255, 255, 0.32),
                inset 0 -1px 0 rgba(0, 0, 0, 0.28),
                inset 1px 0 0 rgba(255, 255, 255, 0.12),
                inset -1px 0 0 rgba(0, 0, 0, 0.14) !important;
            transition: box-shadow 0.2s ease;
        }
    `;
    document.head.appendChild(style);
}

function restoreNotes() {
    const currentURL = getNormalizedURL();

    chrome.storage.local.get(null, (items) => {
        Object.values(items).forEach(noteData => {
            if (noteData.url !== currentURL) return;
            if (document.querySelector(`[data-id="${noteData.id}"]`)) return;

            const note = document.createElement("div");

            note.dataset.id = noteData.id;
            note.dataset.url = noteData.url;
            note.dataset.timestamp = noteData.timestamp || Date.now();

            note.innerText = noteData.content;
            note.contentEditable = true;
            note.spellcheck = false;

            note.style.position = "absolute";
            note.style.left = noteData.x;
            note.style.top = noteData.y;

            note.dataset.browserNote = 'true';

            note.style.padding = "16px";
            note.style.paddingTop = "44px";
            note.style.width = noteData.width || "200px";
            note.style.height = noteData.height || "200px";
            note.style.zIndex = "9999";
            note.style.color = "rgba(255, 255, 255, 0.88)";
            note.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
            note.style.fontSize = "15px";
            note.style.lineHeight = "1.5";
            note.style.wordWrap = "break-word";
            note.style.overflowWrap = "break-word";
            note.style.cursor = "text";
            note.style.whiteSpace = "pre-wrap";
            note.style.resize = "both";
            note.style.overflow = "auto";

            note.addEventListener("input", () => saveNote(note));
            note.addEventListener("mouseup", () => saveNote(note));
            note.addEventListener("keydown", (e) => e.stopPropagation());
            note.addEventListener("keyup", (e) => e.stopPropagation());
            note.addEventListener("keypress", (e) => e.stopPropagation());

            const dragHandle = createDragHandle(note);
            note.appendChild(dragHandle);

            const deleteBtn = createDeleteButton(note);
            note.appendChild(deleteBtn);

            guardNoteControls(note, dragHandle, deleteBtn);

            document.body.appendChild(note);
        })
    })
}

function cleanupNotes() {
    const currentURL = getNormalizedURL();
    document.querySelectorAll('[data-id][data-url]').forEach(note => {
        if (note.dataset.url !== currentURL) {
            note.remove();
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { injectGlassStyles(); restoreNotes(); });
}
else {
    injectGlassStyles();
    restoreNotes();
}

let lastTrackedURL = getNormalizedURL();
setInterval(() => {
    const currentURL = getNormalizedURL();
    if (currentURL !== lastTrackedURL) {
        lastTrackedURL = currentURL;
        cleanupNotes();
        restoreNotes();
    }
}, 500);

let lastRightX = 0;
let lastRightY = 0;

document.addEventListener("contextmenu", (event) => {
    lastRightX = event.pageX;
    lastRightY = event.pageY;
})

function saveNote(note) {
    const id = note.dataset.id;
    const url = note.dataset.url;

    const noteData = {
        id: id,
        content: note.innerText,
        x: note.style.left,
        y: note.style.top,
        url: url,
        width: note.style.width,
        height: note.style.height,
        timestamp: parseInt(note.dataset.timestamp, 10) || Date.now()
    }

    chrome.storage.local.set({ [id]: noteData });
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type !== "ADD_STICKY_NOTE") return;

    const note = document.createElement("div");

    const noteId = crypto.randomUUID();
    note.dataset.id = noteId;
    note.dataset.url = getNormalizedURL();
    note.dataset.timestamp = Date.now();

    note.contentEditable = true;
    note.spellcheck = false;

    note.style.position = "absolute";
    note.style.left = `${lastRightX}px`;
    note.style.top = `${lastRightY}px`;

    note.dataset.browserNote = 'true';

    note.style.padding = "16px";
    note.style.paddingTop = "44px";
    note.style.width = "200px";
    note.style.height = "200px";
    note.style.zIndex = "9999";
    note.style.color = "rgba(255, 255, 255, 0.88)";
    note.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    note.style.fontSize = "15px";
    note.style.lineHeight = "1.5";
    note.style.wordWrap = "break-word";
    note.style.overflowWrap = "break-word";
    note.style.cursor = "text";
    note.style.whiteSpace = "pre-wrap";
    note.style.resize = "both";
    note.style.overflow = "auto";

    note.addEventListener("input", () => saveNote(note));
    note.addEventListener("mouseup", () => saveNote(note));
    note.addEventListener("keydown", (e) => e.stopPropagation());
    note.addEventListener("keyup", (e) => e.stopPropagation());
    note.addEventListener("keypress", (e) => e.stopPropagation());

    const dragHandle = createDragHandle(note);
    note.appendChild(dragHandle);

    const deleteBtn = createDeleteButton(note);
    note.appendChild(deleteBtn);

    guardNoteControls(note, dragHandle, deleteBtn);

    document.body.appendChild(note);
});