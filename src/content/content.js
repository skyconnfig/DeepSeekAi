import './styles/style.css';
import { createSvgIcon, createIcon } from "./components/IconManager";
import { createQuickActionButtons } from "./components/QuickActionButtons";
import { createPopup } from "./popup";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import { popupStateManager } from './utils/popupStateManager';

let currentIcon = null;
let currentQuickActions = null;
let isHandlingIconClick = false;
let isSelectionEnabled = true; // 默认启用
let selectedText = "";
let currentPopup = null; // 新增：跟踪当前弹窗
let isRememberWindowSize = false; // 默认不记住窗口大小

const link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL("style.css");
document.head.appendChild(link);

// 加载设置
chrome.storage.sync.get(['selectionEnabled', 'rememberWindowSize', 'windowSize'], function(data) {
  if (typeof data.selectionEnabled !== 'undefined') {
    isSelectionEnabled = data.selectionEnabled;
  }
  if (typeof data.rememberWindowSize !== 'undefined') {
    isRememberWindowSize = data.rememberWindowSize;
  }
});

// 监听设置变化
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    if (changes.selectionEnabled) {
      isSelectionEnabled = changes.selectionEnabled.newValue;
      if (!isSelectionEnabled) {
        removeIcon();
      }
    }
    if (changes.rememberWindowSize) {
      isRememberWindowSize = changes.rememberWindowSize.newValue;
    }
  }
});

function removeIcon() {
  // 保留这个函数是为了兼容性，但它现在什么都不做
}

// 更新安全的弹窗移除函数
function safeRemovePopup() {
  // 立即重置所有状态
  popupStateManager.reset();

  if (!currentPopup) {
    window.aiResponseContainer = null;
    return;
  }

  try {
    // 中止正在进行的 AI 响应
    if (window.currentAbortController) {
      window.currentAbortController.abort();
      window.currentAbortController = null;
    }

    // 如果正在生成回答但被中断，清理最后一条不完整的消息
    if (window.aiResponseContainer && window.aiResponseContainer.isGenerating) {
      // 通过消息传递来清理消息历史
      window.dispatchEvent(new CustomEvent('cleanupIncompleteMessage'));
    }

    // 移除所有事件监听器和引用
    if (window.aiResponseContainer) {
      // 清理滚动相关实例
      if (window.aiResponseContainer.perfectScrollbar) {
        window.aiResponseContainer.perfectScrollbar.destroy();
        delete window.aiResponseContainer.perfectScrollbar;
      }

      if (window.aiResponseContainer.scrollStateManager?.cleanup) {
        window.aiResponseContainer.scrollStateManager.cleanup();
        delete window.aiResponseContainer.scrollStateManager;
      }

      if (window.aiResponseContainer.cleanup) {
        window.aiResponseContainer.cleanup();
        delete window.aiResponseContainer.cleanup;
      }

      // 移除所有事件监听器
      const clone = window.aiResponseContainer.cloneNode(true);
      window.aiResponseContainer.parentNode.replaceChild(clone, window.aiResponseContainer);
      window.aiResponseContainer = clone;
    }

    // 保存窗口大小
    if (isRememberWindowSize && currentPopup.offsetWidth > 100 && currentPopup.offsetHeight > 100) {
      const width = currentPopup.offsetWidth;
      const height = currentPopup.offsetHeight;
      chrome.storage.sync.set({ windowSize: { width, height } });
    }

    // 清理所有观察者和事件监听器
    if (currentPopup._resizeObserver) {
      currentPopup._resizeObserver.disconnect();
      delete currentPopup._resizeObserver;
    }
    if (currentPopup._mutationObserver) {
      currentPopup._mutationObserver.disconnect();
      delete currentPopup._mutationObserver;
    }
    if (currentPopup._removeThemeListener) {
      currentPopup._removeThemeListener();
      delete currentPopup._removeThemeListener;
    }

    // 使用 try-catch 包装 DOM 操作
    try {
      if (document.body.contains(currentPopup)) {
        // 在移除之前先将内容清空，避免触发不必要的事件
        currentPopup.innerHTML = '';
        document.body.removeChild(currentPopup);
      }
    } catch (e) {
      console.warn('Error removing popup from DOM:', e);
    }

    // 确保状态被重置
    window.aiResponseContainer = null;
    currentPopup = null;
  } catch (error) {
    console.warn('Failed to remove popup:', error);
    // 确保在出错时也能重置所有状态
    if (document.body.contains(currentPopup)) {
      try {
        currentPopup.innerHTML = '';
        document.body.removeChild(currentPopup);
      } catch (e) {
        console.warn('Error removing popup in catch block:', e);
      }
    }
    // 重置所有状态
    window.aiResponseContainer = null;
    currentPopup = null;
  }

  // 最后再次确保所有状态都被重置
  popupStateManager.reset();
}

function handlePopupCreation(selectedText, rect, hideQuestion = false, messages = null, quickActionPrompt = null) {
  if (popupStateManager.isCreating()) return;

  popupStateManager.setCreating(true);

  try {
    // 先移除快捷按钮
    removeIcon();
    // 清除选中的文本
    window.getSelection().removeAllRanges();

    safeRemovePopup();
    currentPopup = createPopup(selectedText, rect, hideQuestion, safeRemovePopup, messages, quickActionPrompt);
    currentPopup.style.minWidth = '300px';
    currentPopup.style.minHeight = '200px';

    if (isRememberWindowSize) {
      chrome.storage.sync.get(['windowSize'], function(data) {
        if (data.windowSize &&
            data.windowSize.width >= 300 &&
            data.windowSize.height >= 200 &&
            currentPopup) {
          requestAnimationFrame(() => {
            currentPopup.style.width = `${data.windowSize.width}px`;
            currentPopup.style.height = `${data.windowSize.height}px`;
          });
        }
      });
    }

    document.body.appendChild(currentPopup);
    popupStateManager.setVisible(true);  // 更新状态

    // 设置窗口大小监听
    if (isRememberWindowSize && currentPopup) {
      setupResizeObserver(currentPopup);
    }
  } catch (error) {
    console.error('Error in handlePopupCreation:', error);
    safeRemovePopup();
  } finally {
    setTimeout(() => {
      popupStateManager.setCreating(false);
    }, 100);
  }
}

function togglePopup(selectedText, rect, hideQuestion = false) {
  // 如果正在处理中，直接返回
  if (popupStateManager.isCreating()) return;

  try {
    if (popupStateManager.isVisible()) {
      safeRemovePopup();
      // 添加一个短暂的延迟，确保状态完全重置
      setTimeout(() => {
        popupStateManager.reset();
      }, 100);
    } else {
      // 在创建新弹窗前确保清理旧的状态
      safeRemovePopup();
      // 添加一个短暂的延迟，确保旧状态完全清理
      setTimeout(() => {
        handlePopupCreation(selectedText, rect, hideQuestion);
      }, 100);
    }
  } catch (error) {
    console.warn('Error in togglePopup:', error);
    // 确保在出错时重置状态
    safeRemovePopup();
    popupStateManager.reset();
  }
}

// 添加防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 添加 ResizeObserver 设置函数
function setupResizeObserver(popup) {
  if (!popup) return;

  // 如果已存在观察者，先断开连接
  if (popup._resizeObserver) {
    popup._resizeObserver.disconnect();
  }

  // 创建防抖的保存尺寸函数
  const debouncedSaveSize = debounce((width, height) => {
    if (width >= 300 && height >= 200) {
      chrome.storage.sync.set({ windowSize: { width, height } });
    }
  }, 500);

  // 创建新的 ResizeObserver
  popup._resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      debouncedSaveSize(width, height);
    }
  });

  // 开始观察
  popup._resizeObserver.observe(popup);
}

function handleIconClick(e, selectedText, rect) {
  e.stopPropagation();
  e.preventDefault();

  isHandlingIconClick = true;

  try {
    // 移除按钮容器
    removeQuickActions();

    // 如果没有传入rect,则使用默认位置
    if (!rect) {
      rect = {
        left: window.innerWidth / 2,
        top: window.innerHeight / 2 - 190,
        width: 0,
        height: 0
      };
    }

    // 清除选中的文本
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    // 显示弹窗
    handlePopupCreation(selectedText || "", rect);
  } catch (error) {
    console.warn('Error in handleIconClick:', error);
    safeRemovePopup();
  } finally {
    setTimeout(() => {
      isHandlingIconClick = false;
    }, 100);
  }
}

document.addEventListener("mouseup", function (event) {
  if (!isSelectionEnabled || popupStateManager.isCreating() || isHandlingIconClick) return;

  const selection = window.getSelection();

  // 使用updateSelectionUI来处理所有UI更新
  if (selection && event.button === 0) {
    updateSelectionUI(selection).catch(error => {
      console.error('Error updating selection UI:', error);
    });
  }
}, { passive: true });

document.addEventListener("mousedown", function(e) {
  if (isHandlingIconClick) return;

  const isClickOnButtons = (
    (currentIcon && currentIcon.contains(e.target)) ||
    (currentQuickActions && currentQuickActions.contains(e.target))
  );

  if (!isClickOnButtons) {
    removeIcon();
    removeQuickActions();
    if (e.button === 0) {
      window.getSelection().removeAllRanges();
    }
  }
}, { passive: true });

// 添加全局点击事件监听
document.addEventListener('mousedown', async (event) => {
  // 如果没有当前弹窗，直接返回
  if (!currentPopup) return;

  // 检查是否启用了固定窗口
  const isPinned = await chrome.storage.sync.get('pinWindow').then(result => result.pinWindow || false);

  // 如果启用了固定窗口，直接返回
  if (isPinned) return;

  // 检查点击区域
  const isClickInside = event.target.closest('#ai-popup') ||
                       event.target.closest('.icon-wrapper') ||
                       event.target.closest('.icon-container') ||
                       event.target.closest('.regenerate-icon');

  // 如果点击在弹窗内部或相关元素上，不关闭
  if (isClickInside) return;

  // 关闭弹窗
  safeRemovePopup();
});

// 添加事件委托处理reasoning content的点击
document.addEventListener('click', (event) => {
  const reasoningHeader = event.target.closest('.reasoning-header');
  if (reasoningHeader) {
    const container = reasoningHeader.closest('.reasoning-content');
    if (container) {
      container.classList.toggle('collapsed');
      container.classList.toggle('expanded');
    }
  }
}, true);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleChat") {
    try {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      let rect;

      if (selection.rangeCount > 0 && (selectedText || request.selectedText)) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      } else {
        rect = {
          left: window.innerWidth / 2,
          top: window.innerHeight / 2 - 190,
          width: 0,
          height: 0
        };
      }

      const text = selectedText || request.selectedText || request.message;
      togglePopup(text, rect, !(selectedText || request.selectedText));
    } catch (error) {
      console.warn('Error handling toggleChat:', error);
      // 确保在出错时重置状态
      safeRemovePopup();
    }
  } else if (request.action === "getSelectedText") {
    sendResponse({ selectedText });
  }
});

function handleQuickAction(action, text) {
  const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
  const messages = [
    {
      role: "user",
      content: text,
    }
  ];

  // 先移除按钮容器
  removeQuickActions();
  // 清除选中的文本
  window.getSelection().removeAllRanges();

  // 对于翻译操作，如果没有指定语言，默认使用中文
  let prompt = action.prompt;
  if (action.id === 'translate' && !prompt.includes('简体中文')) {
    prompt = action.prompt.replace('{language}', '简体中文');
  }

  // 然后显示弹窗，传递处理后的 prompt
  handlePopupCreation(text, rect, false, messages, prompt);
}

async function updateSelectionUI(selection) {
  if (!isSelectionEnabled || !selection || selection.isCollapsed) {
    removeQuickActions();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  selectedText = selection.toString().trim();

  if (!selectedText) {
    removeQuickActions();
    return;
  }

  // 计算按钮容器位置 - 在选中文本下方
  const containerX = rect.left + window.scrollX;
  const containerY = rect.bottom + window.scrollY + 5; // 在文本下方5px的位置

  if (!currentQuickActions) {
    currentQuickActions = await createQuickActionButtons(
      selectedText,
      handleQuickAction,
      handleIconClick
    );
    document.body.appendChild(currentQuickActions);
  }

  Object.assign(currentQuickActions.style, {
    position: 'absolute',
    left: `${containerX}px`,
    top: `${containerY}px`,
  });
}

function removeQuickActions() {
  if (currentQuickActions && document.body.contains(currentQuickActions)) {
    document.body.removeChild(currentQuickActions);
    currentQuickActions = null;
  }
}

// 添加全局点击事件监听，用于关闭语言选择菜单
document.addEventListener('click', (e) => {
  const languageSelect = document.querySelector('.language-select');
  if (languageSelect && languageSelect.style.display === 'block') {
    const isClickInside = e.target.closest('.quick-action-translate');
    if (!isClickInside) {
      languageSelect.style.display = 'none';
    }
  }
});
