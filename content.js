function createDragHandle(note) {
    const handle = document.createElement("div");

    handle.style.position = "absolute";
    handle.style.top = "6px";
    handle.style.left = "50%";
    handle.style.transform = "translateX(-50%)";
    handle.style.width = "12px";
    handle.style.height = "12px";
    handle.style.borderRadius = "50%";
    handle.style.backgroundColor = "rgba(100, 100, 100, 0.4)";
    handle.style.cursor = "grab";
    handle.style.zIndex = "10000";
    handle.contentEditable = "false";

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
    btn.style.top = "6px";
    btn.style.right = "6px";
    btn.style.width = "14px";
    btn.style.height = "14px";
    btn.style.cursor = "pointer";
    btn.style.opacity = "0.5";
    btn.style.transition = "opacity 0.2s";
    btn.contentEditable = "false";

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
    return window.location.origin + window.location.pathname;
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

            note.innerText = noteData.content;
            note.contentEditable = true;
            note.spellcheck = false;

            note.style.position = "absolute";
            note.style.left = noteData.x;
            note.style.top = noteData.y;

            note.style.backgroundColor = "rgba(242, 242, 242, 0.85)";
            note.style.backdropFilter = "blur(8px) saturate(120%)";
            note.style.WebkitBackdropFilter = "blur(8px) saturate(120%)";
            note.style.color = "#111111";
            note.style.border = "1px solid rgba(0, 0, 0, 0.1)";
            note.style.padding = "20px 15px";
            note.style.paddingTop = "24px";
            note.style.minWidth = "150px";
            note.style.maxWidth = "300px";
            note.style.minHeight = "100px";
            note.style.zIndex = "9999";
            note.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
            note.style.fontSize = "15px";
            note.style.lineHeight = "1.5";
            note.style.wordWrap = "break-word";
            note.style.overflowWrap = "break-word";
            note.style.boxShadow = "2px 4px 12px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.15)";
            note.style.borderRadius = "2px";
            note.style.transform = noteData.rotation || `rotate(${Math.random() * 4 - 2}deg)`;
            note.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
            note.style.cursor = "text";
            note.style.whiteSpace = "pre-wrap";

            note.addEventListener("input", () => saveNote(note));

            const dragHandle = createDragHandle(note);
            note.appendChild(dragHandle);

            const deleteBtn = createDeleteButton(note);
            note.appendChild(deleteBtn);

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
    document.addEventListener("DOMContentLoaded", restoreNotes);
}
else {
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
        rotation: note.style.transform
    }

    chrome.storage.local.set({ [id]: noteData });
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type !== "ADD_STICKY_NOTE") return;

    const note = document.createElement("div");

    const noteId = crypto.randomUUID();
    note.dataset.id = noteId;
    note.dataset.url = getNormalizedURL();

    note.contentEditable = true;
    note.spellcheck = false;

    note.style.position = "absolute";
    note.style.left = `${lastRightX}px`;
    note.style.top = `${lastRightY}px`;

    note.style.backgroundColor = "rgba(242, 242, 242, 0.85)";
    note.style.backdropFilter = "blur(8px) saturate(120%)";
    note.style.WebkitBackdropFilter = "blur(8px) saturate(120%)";
    note.style.color = "#111111";
    note.style.border = "1px solid rgba(0, 0, 0, 0.1)";
    note.style.padding = "20px 15px";
    note.style.paddingTop = "24px";
    note.style.minWidth = "150px";
    note.style.maxWidth = "300px";
    note.style.minHeight = "100px";
    note.style.zIndex = "9999";
    note.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    note.style.fontSize = "15px";
    note.style.lineHeight = "1.5";
    note.style.wordWrap = "break-word";
    note.style.overflowWrap = "break-word";
    note.style.boxShadow = "2px 4px 12px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.15)";
    note.style.borderRadius = "2px";
    note.style.transform = `rotate(${Math.random() * 4 - 2}deg)`;
    note.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    note.style.cursor = "text";
    note.style.whiteSpace = "pre-wrap";

    note.addEventListener("input", () => saveNote(note));

    const dragHandle = createDragHandle(note);
    note.appendChild(dragHandle);

    const deleteBtn = createDeleteButton(note);
    note.appendChild(deleteBtn);

    document.body.appendChild(note);
});