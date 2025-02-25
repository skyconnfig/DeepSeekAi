export class ApiKeyManager {
  constructor() {
    this.lastValidatedValue = '';
  }

  async validateApiKey(apiKey, provider, settings) {
    if (!apiKey) return false;

    try {
      const providerConfig = {
        'deepseek': {
          url: 'https://api.deepseek.com/v1/chat/completions',
          model: settings?.model || 'deepseek-chat'
        },
        'siliconflow': {
          url: 'https://api.siliconflow.cn/v1/chat/completions',
          model: settings?.model || 'deepseek-ai/DeepSeek-V3'
        },
        'openrouter': {
          url: 'https://openrouter.ai/api/v1/chat/completions',
          model: settings?.model || 'deepseek/deepseek-chat:free'
        },
        'tencentcloud': {
          url: 'https://api.lkeap.cloud.tencent.com/v1/chat/completions',
          model: settings?.model || 'deepseek-v3'
        },
        'volcengine': {
          url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          model: settings?.model || 'deepseek-v3-241226'
        },
        'iflytekstar': {
          url: 'https://maas-api.cn-huabei-1.xf-yun.com/v1/chat/completions',
          model: settings?.model || 'xdeepseekv3'
        },
        'baiducloud': {
          url: 'https://qianfan.baidubce.com/v2/chat/completions',
          model: settings?.model || 'deepseek-v3'
        },
        'aliyun': {
          url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          model: settings?.model || 'deepseek-v3'
        },
        'aihubmix': {
          url: 'https://aihubmix.com/v1/chat/completions',
          model: settings?.model || 'DeepSeek-R1'
        }
      };

      const config = providerConfig[provider];
      if (!config) return false;

      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          action: "proxyRequest",
          url: config.url,
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: 'test' }],
            stream: false
          })
        }, resolve);
      });

      console.log('API validation response:', response);

      if (response?.status === 200) {
        await this.saveApiKey(apiKey, provider);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  async getApiKey(provider) {
    try {
      const keyName = `${provider}ApiKey`;
      return new Promise((resolve) => {
        chrome.storage.sync.get(keyName, (data) => {
          resolve(data[keyName] || '');
        });
      });
    } catch (error) {
      console.error('Get API key error:', error);
      return '';
    }
  }

  async saveApiKey(apiKey, provider) {
    try {
      const keyName = `${provider}ApiKey`;
      return new Promise((resolve) => {
        chrome.storage.sync.set({ [keyName]: apiKey }, () => {
          if (chrome.runtime.lastError) {
            console.error('Save API key error:', chrome.runtime.lastError);
            resolve(false);
          } else {
            this.lastValidatedValue = apiKey;
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('Save API key error:', error);
      return false;
    }
  }

  // 获取自定义API URL
  async getCustomApiUrl(provider) {
    try {
      const keyName = `${provider}CustomApiUrl`;
      return new Promise((resolve) => {
        chrome.storage.sync.get(keyName, (data) => {
          resolve(data[keyName] || '');
        });
      });
    } catch (error) {
      console.error('获取自定义API URL错误:', error);
      return '';
    }
  }

  // 保存自定义API URL
  async saveCustomApiUrl(customApiUrl, provider) {
    try {
      const keyName = `${provider}CustomApiUrl`;
      return new Promise((resolve) => {
        chrome.storage.sync.set({ [keyName]: customApiUrl }, () => {
          if (chrome.runtime.lastError) {
            console.error('保存自定义API URL错误:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('保存自定义API URL错误:', error);
      return false;
    }
  }

  // 获取默认API URL
  getDefaultApiUrl(provider) {
    const providerUrls = {
      'deepseek': 'https://api.deepseek.com/v1/chat/completions',
      'siliconflow': 'https://api.siliconflow.cn/v1/chat/completions',
      'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
      'volcengine': 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      'tencentcloud': 'https://api.lkeap.cloud.tencent.com/v1/chat/completions',
      'iflytekstar': 'https://maas-api.cn-huabei-1.xf-yun.com/v1/chat/completions',
      'baiducloud': 'https://qianfan.baidubce.com/v2/chat/completions',
      'aliyun': 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      'aihubmix': 'https://aihubmix.com/v1/chat/completions'
    };

    return providerUrls[provider] || providerUrls['deepseek'];
  }
}