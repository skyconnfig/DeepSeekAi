import { getAllowAutoScroll, scrollToBottom } from "../utils/scrollManager";
import { md } from "../utils/markdownRenderer";

// 全局变量用于存储对话历史
let messages = [];
let isGenerating = false;
let renderQueue = [];

// 用于存储当前响应的内容
let currentReasoningContent = "";
let currentContent = "";

// 使用 Performance API 优化性能监控
const performance = window.performance;

export function getIsGenerating() {
  return isGenerating;
}

const processText = (text, type) => {
  if (type === 'cleanup') {
    return text.trim().replace(/\s+/g, ' ');
  }
  return text;
};

// 优化渲染队列处理
async function processRenderQueue(responseElement, ps, aiResponseContainer) {
  if (!responseElement?.isConnected || !aiResponseContainer?.isConnected) {
    renderQueue = [];
    return;
  }

  const currentChunk = renderQueue[renderQueue.length - 1];
  if (!currentChunk) return;

  try {
    // 获取或创建reasoning content元素
    if (currentChunk.reasoningContent) {
      let reasoningContentElement = responseElement.querySelector('.reasoning-content');
      if (!reasoningContentElement) {
        reasoningContentElement = document.createElement('div');
        reasoningContentElement.className = 'reasoning-content expanded';
        reasoningContentElement.innerHTML = `
          <div class="reasoning-header">
            <div class="reasoning-toggle"></div>
            <span>Reasoning process</span>
          </div>
          <div class="reasoning-content-inner"></div>
        `;
        responseElement.insertBefore(reasoningContentElement, responseElement.firstChild);
      }

      const reasoningInner = reasoningContentElement.querySelector('.reasoning-content-inner');
      if (reasoningInner) {
        const reasoningHtml = await md.render(currentChunk.reasoningContent);
        reasoningInner.innerHTML = reasoningHtml;
      }
    }

    // 获取或创建content容器
    if (currentChunk.content) {
      let contentElement = responseElement.querySelector('.content-container');
      if (!contentElement) {
        contentElement = document.createElement('div');
        contentElement.className = 'content-container';
        responseElement.appendChild(contentElement);
      }

      const contentHtml = await md.render(currentChunk.content);
      contentElement.innerHTML = contentHtml;
    }

    // 使用requestAnimationFrame优化滚动和更新
    if (getAllowAutoScroll() && aiResponseContainer.isConnected) {
      requestAnimationFrame(() => {
        scrollToBottom(aiResponseContainer);
        if (ps?.update) ps.update();
      });
    }
  } catch (error) {
    console.error('Error processing render queue:', error);
  }
}

// 验证和清理消息历史
function validateAndCleanMessages() {
  // 如果发现连续的user消息，删除前一条
  for (let i = messages.length - 1; i > 0; i--) {
    if (messages[i].role === 'user' && messages[i-1].role === 'user') {
      messages.splice(i-1, 1);
    }
  }
}

export async function getAIResponse(
  text,
  responseElement,
  signal,
  ps,
  iconContainer,
  aiResponseContainer,
  isRefresh = false,
  onComplete,
  isGreeting = false,
  quickActionPrompt = ''
) {
  if (!text) return;

  isGenerating = true;
  window.currentAbortController = signal?.controller || new AbortController();

  // 设置中止信号处理
  window.currentAbortController.signal.addEventListener('abort', () => {
    // 发送中止请求消息到background
    chrome.runtime.sendMessage({ action: "abortRequest" });
  });

  if (isRefresh) {
    messages = messages.slice(0, -1);
  }

  validateAndCleanMessages();
  if (!isRefresh) {
    messages.push({ role: "user", content: text });
  }

  const existingIconContainer = responseElement.querySelector('.icon-container');
  const originalClassName = responseElement.className;
  responseElement.textContent = "";
  if (existingIconContainer) {
    responseElement.appendChild(existingIconContainer);
  }
  responseElement.className = originalClassName;

  try {
    const settings = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: "getSettings" }, resolve);
    });

    const provider = settings.provider || 'deepseek';
    const apiKey = provider === 'volcengine' ? settings.volcengineApiKey :
                  provider === 'siliconflow' ? settings.siliconflowApiKey :
                  provider === 'openrouter' ? settings.openrouterApiKey :
                  settings.deepseekApiKey;
    const language = settings.language;
    const model = settings.model;
    const v3model = settings.v3model;
    const r1model = settings.r1model;

    if (!apiKey) {
      const linkElement = document.createElement("a");
      linkElement.href = "#";
      linkElement.textContent = "Please first set your API key in extension popup.";
      linkElement.style.color = "#0066cc";
      linkElement.style.textDecoration = "underline";
      linkElement.style.cursor = "pointer";
      linkElement.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await chrome.runtime.sendMessage({ action: "openPopup" });
        } catch (error) {
          console.error('Failed to open popup:', error);
          chrome.runtime.sendMessage({ action: "getSelectedText" });
        }
      });
      responseElement.textContent = "";
      responseElement.appendChild(linkElement);
      if (existingIconContainer) {
        responseElement.appendChild(existingIconContainer);
      }
      return;
    }

    const modelName = provider === 'volcengine'
      ? (model === 'r1' ? r1model : v3model)
      : (isGreeting ? "deepseek-chat" : model);

    // 检查火山引擎的Model ID
    if (provider === 'volcengine') {
      const requiredModel = model === 'r1' ? r1model : v3model;
      if (!requiredModel) {
        const modelType = model === 'r1' ? 'R1' : 'V3';
        const linkElement = document.createElement("a");
        linkElement.href = "#";
        linkElement.textContent = `Please configure the ${modelType} Model ID in the extension settings first.`;
        linkElement.style.color = "#0066cc";
        linkElement.style.textDecoration = "underline";
        linkElement.style.cursor = "pointer";
        linkElement.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            await chrome.runtime.sendMessage({ action: "openPopup" });
          } catch (error) {
            console.error('Failed to open popup:', error);
            chrome.runtime.sendMessage({ action: "getSelectedText" });
          }
        });
        responseElement.textContent = "";
        responseElement.appendChild(linkElement);
        if (existingIconContainer) {
          responseElement.appendChild(existingIconContainer);
        }
        return;
      }
    }

    const systemPrompt = quickActionPrompt && quickActionPrompt.includes('You are a professional multilingual translation engine')
      ? quickActionPrompt
      : language === "auto"
        ? "Detect and respond in the same language as the user's input. If the user's input is in Chinese, respond in Chinese. If the user's input is in English, respond in English, etc."
        : `You MUST respond ONLY in ${language}.Including your reasoningContent language. This is a strict requirement. Do not use any other language except ${language}.${quickActionPrompt || ''}`;

    const apiUrl = provider === 'volcengine'
      ? 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
      : provider === 'siliconflow'
      ? 'https://api.siliconflow.cn/v1/chat/completions'
      : provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.deepseek.com/v1/chat/completions';

    const response = await new Promise((resolve, reject) => {
      let aiResponse = "";
      let reasoningContent = "";
      let aborted = false;

      window.currentAbortController.signal.addEventListener('abort', () => {
        aborted = true;
        resolve({ ok: true, content: aiResponse });
      });

      function handleResponse(response) {
        if (aborted) return;

        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        if (!response.ok) {
          reject(new Error(response.error || 'Request failed'));
          return;
        }

        if (response.done) {
          resolve({ ok: true, content: aiResponse });
          return;
        }

        try {
          const line = response.data;
          if (!line.startsWith("data: ")) return;

          const jsonLine = line.slice(6);
          if (jsonLine === "[DONE]") {
            resolve({ ok: true, content: aiResponse });
            return;
          }

          const data = JSON.parse(jsonLine);

          requestAnimationFrame(() => {
            if (provider === 'openrouter' && data.choices?.[0]?.delta?.reasoning) {
              reasoningContent += data.choices[0].delta.reasoning;
              currentReasoningContent = reasoningContent;
              renderQueue = [{
                reasoningContent,
                content: aiResponse
              }];
              processRenderQueue(responseElement, ps, aiResponseContainer);
            } else if (data.choices?.[0]?.delta?.reasoning_content) {
              reasoningContent += data.choices[0].delta.reasoning_content;
              currentReasoningContent = reasoningContent;
              renderQueue = [{
                reasoningContent,
                content: aiResponse
              }];
              processRenderQueue(responseElement, ps, aiResponseContainer);
            }
            if (data.choices?.[0]?.delta?.content) {
              const content = data.choices[0].delta.content;
              aiResponse += content;
              currentContent = aiResponse;
              renderQueue = [{
                reasoningContent: provider === 'openrouter' || model === "r1" ? reasoningContent : "",
                content: aiResponse
              }];
              processRenderQueue(responseElement, ps, aiResponseContainer);
            }
          });
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }

      const messageListener = (msg) => {
        if (msg.type === "streamResponse") {
          handleResponse(msg.response);
          if (msg.response.done) {
            chrome.runtime.onMessage.removeListener(messageListener);
          }
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      const requestBody = {
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
        ...(provider === 'openrouter' && { include_reasoning: true })
      };

      console.log(`🚀 发送请求 - 服务商: ${provider}, 模型: ${modelName}`);

      chrome.runtime.sendMessage({
        action: "proxyRequest",
        url: apiUrl,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody)
      });
    });

    if (currentContent) {
      messages.push({ role: "assistant", content: currentContent });
    }
    requestIdleCallback(() => {
      if (window.addIconsToElement) {
        window.addIconsToElement(responseElement);
      }
      if (window.updateLastAnswerIcons) {
        window.updateLastAnswerIcons();
      }
    }, { timeout: 1000 });

    if (iconContainer) {
      iconContainer.style.display = 'flex';
      iconContainer.dataset.initialShow = 'true';

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const buttonContainer = responseElement.querySelector('.icon-container');
            if (buttonContainer && aiResponseContainer) {
              const buttonRect = buttonContainer.getBoundingClientRect();
              const containerRect = aiResponseContainer.getBoundingClientRect();
              const buttonBottom = buttonRect.bottom - containerRect.top;

              if (buttonBottom > aiResponseContainer.clientHeight) {
                const extraScroll = buttonBottom - aiResponseContainer.clientHeight + 40;
                aiResponseContainer.scrollTop += extraScroll;
                if (ps) ps.update();
              }
            }
            observer.disconnect();
          }
        });
      });

      observer.observe(iconContainer);
    }

    if (onComplete) {
      requestIdleCallback(() => onComplete(), { timeout: 1000 });
    }
  } catch (error) {
    console.error("Error:", error);
    if (error.name !== 'AbortError') {
      const textNode = document.createTextNode("Request failed. Please try again later.");
      responseElement.textContent = "";
      responseElement.appendChild(textNode);
      if (existingIconContainer) {
        responseElement.appendChild(existingIconContainer);
      }
    }
  } finally {
    isGenerating = false;
    window.currentAbortController = null;
  }
}

function handleError(status, responseElement) {
  const errorMessages = {
    400: "Request body format error, please check and modify.",
    401: "API key error, authentication failed.",
    402: "Insufficient account balance, please recharge.",
    422: "Request body parameter error, please check and modify.",
    429: "Request rate limit reached, please try again later.",
    500: "Internal server error, please try again later.",
    503: "Server overload, please try again later."
  };
  const textNode = document.createTextNode(errorMessages[status] || "Request failed, please try again later.");
  responseElement.textContent = "";
  responseElement.appendChild(textNode);
}