export class StorageManager {
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
          ["deepseekApiKey", "siliconflowApiKey", "openrouterApiKey","volcengineApiKey" ,"tencentcloudApiKey", "iflytekstarApiKey","baiducloudApiKey","aliyunApiKey", "aihubmixApiKey",
           "deepseekCustomApiUrl", "siliconflowCustomApiUrl", "openrouterCustomApiUrl", "volcengineCustomApiUrl", "tencentcloudCustomApiUrl", "iflytekstarCustomApiUrl", "baiducloudCustomApiUrl", "aliyunCustomApiUrl", "aihubmixCustomApiUrl",
           "language", "model", "provider", "selectionEnabled", "rememberWindowSize", "pinWindow"],
        (data) => {
          resolve({
            deepseekApiKey: data.deepseekApiKey || '',
            siliconflowApiKey: data.siliconflowApiKey || '',
            openrouterApiKey: data.openrouterApiKey || '',
            volcengineApiKey: data.volcengineApiKey || '',
            tencentcloudApiKey: data.tencentcloudApiKey || '',
            iflytekstarApiKey: data.iflytekstarApiKey || '',
            baiducloudApiKey: data.baiducloudApiKey || '',
            aliyunApiKey: data.aliyunApiKey || '',
            aihubmixApiKey: data.aihubmixApiKey || '',
            deepseekCustomApiUrl: data.deepseekCustomApiUrl || '',
            siliconflowCustomApiUrl: data.siliconflowCustomApiUrl || '',
            openrouterCustomApiUrl: data.openrouterCustomApiUrl || '',
            volcengineCustomApiUrl: data.volcengineCustomApiUrl || '',
            tencentcloudCustomApiUrl: data.tencentcloudCustomApiUrl || '',
            iflytekstarCustomApiUrl: data.iflytekstarCustomApiUrl || '',
            baiducloudCustomApiUrl: data.baiducloudCustomApiUrl || '',
            aliyunCustomApiUrl: data.aliyunCustomApiUrl || '',
            aihubmixCustomApiUrl: data.aihubmixCustomApiUrl || '',
            language: data.language || 'en',
            model: data.model || 'deepseek-chat',
            provider: data.provider || 'deepseek',
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

  async saveCustomApiUrl(provider, customApiUrl) {
    const key = `${provider}CustomApiUrl`;
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: customApiUrl }, resolve);
    });
  }
}