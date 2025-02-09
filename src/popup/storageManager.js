export class StorageManager {
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ["deepseekApiKey", "volcengineApiKey", "siliconflowApiKey", "openrouterApiKey", "tencentcloudApiKey", "language", "model", "provider", "v3model", "r1model", "selectionEnabled", "rememberWindowSize", "pinWindow"],
        (data) => {
          resolve({
            deepseekApiKey: data.deepseekApiKey || '',
            volcengineApiKey: data.volcengineApiKey || '',
            siliconflowApiKey: data.siliconflowApiKey || '',
            openrouterApiKey: data.openrouterApiKey || '',
            tencentcloudApiKey: data.tencentcloudApiKey || '',
            language: data.language || 'en',
            model: data.model || 'deepseek-chat',
            provider: data.provider || 'deepseek',
            v3model: data.v3model || '',
            r1model: data.r1model || '',
            selectionEnabled: typeof data.selectionEnabled === 'undefined' ? true : data.selectionEnabled,
            rememberWindowSize: typeof data.rememberWindowSize === 'undefined' ? false : data.rememberWindowSize,
            pinWindow: typeof data.pinWindow === 'undefined' ? false : data.pinWindow
          });
        }
      );
    });
  }

  async saveApiKey(provider, apiKey) {
    const key = `${provider}ApiKey`;
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: apiKey }, resolve);
    });
  }

  async saveLanguage(language) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ language }, resolve);
    });
  }

  async saveModel(model) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ model }, resolve);
    });
  }

  async saveProvider(provider) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ provider }, resolve);
    });
  }

  async saveV3Model(v3model) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ v3model }, resolve);
    });
  }

  async saveR1Model(r1model) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ r1model }, resolve);
    });
  }

  async saveSelectionEnabled(enabled) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ selectionEnabled: enabled }, resolve);
    });
  }

  async saveRememberWindowSize(enabled) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ rememberWindowSize: enabled }, resolve);
    });
  }

  async savePinWindow(enabled) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ pinWindow: enabled }, resolve);
    });
  }
}