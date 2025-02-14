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
        'volcengine': {
          url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          model: settings?.model === 'r1' ? settings?.r1model : settings?.v3model
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

      // 检查火山引擎的Model ID，只检查当前选择的模型
      if (provider === 'volcengine' && !config.model) {
        return false;
      }

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
}