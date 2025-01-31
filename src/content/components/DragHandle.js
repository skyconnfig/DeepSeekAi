export function initDraggable(dragHandle, popup) {
  let isDragging = false;
  let startX, startY;
  let initialX, initialY;

  dragHandle.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);

  function startDragging(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = popup.offsetLeft;
    initialY = popup.offsetTop;
    popup.style.transition = 'none';
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    popup.style.left = `${initialX + dx}px`;
    popup.style.top = `${initialY + dy}px`;
  }

  function stopDragging() {
    isDragging = false;
    popup.style.transition = 'transform 0.05s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  return () => {
    dragHandle.removeEventListener('mousedown', startDragging);
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
  };
}

export function resizeMoveListener(event) {
  const { target, rect } = event;

  Object.assign(target.style, {
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });

  if (event.edges.left) {
    target.style.left = `${rect.left}px`;
  }
  if (event.edges.top) {
    target.style.top = `${rect.top}px`;
  }
}

export function createDragHandle(removeCallback) {
  const dragHandle = document.createElement("div");
  Object.assign(dragHandle.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "40px",
    cursor: "move",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
    boxSizing: "border-box",
  });

  dragHandle.classList.add('drag-handle');

  const titleContainer = document.createElement("div");
  Object.assign(titleContainer.style, {
    display: "flex",
    alignItems: "center",
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "none"
  });

  const logo = document.createElement("img");
  logo.src = chrome.runtime.getURL("icons/icon24.png");
  Object.assign(logo.style, {
    height: "24px",
    marginRight: "10px",
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "none",
    WebkitUserDrag: "none",
    WebkitAppRegion: "no-drag",
    draggable: false
  });
  logo.setAttribute("draggable", "false");

  const textNode = document.createElement("span");
  Object.assign(textNode.style, {
    fontWeight: "bold",
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "none"
  });
  textNode.textContent = "DeepSeek AI";
  titleContainer.appendChild(logo);
  titleContainer.appendChild(textNode);

  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  Object.assign(closeButton.style, {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0",
    margin: "0",
    transition: "all 0.2s ease",
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%) scale(1)",
    width: "20px",
    height: "20px",
    minWidth: "20px",
    minHeight: "20px",
    maxWidth: "20px",
    maxHeight: "20px",
    lineHeight: "1",
    outline: "none",
    boxSizing: "content-box",
    zIndex: "2147483647",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none"
  });

  const closeIcon = document.createElement("img");
  closeIcon.src = chrome.runtime.getURL("icons/close.svg");
  Object.assign(closeIcon.style, {
    width: "20px",
    height: "20px",
    display: "block",
    padding: "0",
    margin: "0",
    border: "none",
    outline: "none",
    boxSizing: "border-box",
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none"
  });

  closeButton.appendChild(closeIcon);
  dragHandle.appendChild(titleContainer);
  dragHandle.appendChild(closeButton);

  dragHandle.addEventListener("mouseenter", () => {
    closeButton.style.display = "block";
  });

  dragHandle.addEventListener("mouseleave", () => {
    closeButton.style.display = "none";
    closeIcon.src = chrome.runtime.getURL("icons/close.svg");
    closeButton.style.transform = "translateY(-50%) scale(1)";
  });

  closeButton.addEventListener("mouseenter", () => {
    closeIcon.src = chrome.runtime.getURL("icons/closeClicked.svg");
    closeButton.style.transform = "translateY(-50%) scale(1.1)";
  });

  closeButton.addEventListener("mouseleave", () => {
    closeIcon.src = chrome.runtime.getURL("icons/close.svg");
    closeButton.style.transform = "translateY(-50%) scale(1)";
  });

  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (typeof removeCallback === 'function') {
      removeCallback();
    }
  });

  return dragHandle;
}