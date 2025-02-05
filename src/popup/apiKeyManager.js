export class ApiKeyManager {
  constructor() {
    this.lastValidatedValue = '';
  }

  async validateApiKey(apiKey, provider) {
    if (!apiKey) return false;

    try {
      const apiUrl = provider === 'volcengine'
        ? 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
        : 'https://api.deepseek.com/chat/completions';

      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "proxyRequest",
          url: apiUrl,
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: provider === 'volcengine' ? 'ep-20250205172154-ch2p6' : 'deepseek-chat',
            messages: [{ role: 'user', content: 'test' }],
            stream: false
          })
        }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  async getApiKey(provider) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        provider === 'volcengine' ? 'volcengineApiKey' : 'deepseekApiKey',
        (data) => resolve(data[provider === 'volcengine' ? 'volcengineApiKey' : 'deepseekApiKey'])
      );
    });
  }

  async saveApiKey(apiKey, provider) {
    return new Promise((resolve) => {
      const key = provider === 'volcengine' ? 'volcengineApiKey' : 'deepseekApiKey';
      chrome.storage.sync.set({ [key]: apiKey }, resolve);
    });
  }
}