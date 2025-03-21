export class I18nManager {
  constructor() {
    this.translations = {
      zh: {
        validating: '正在验证...',
        saveSuccess: '保存成功',
        apiKeyInvalid: 'API密钥无效或检查当前所选模型是否可用',
        noBalance: '暂无余额',
        noApiKey: '请先设置 API Key',
        fetchError: '获取失败',
        rememberWindowSize: '保存窗口大小',
        customApiUrlSaveSuccess: '自定义API地址已保存',
        customApiUrlSaveError: '保存自定义API地址失败',
        customApiUrlLabel: '自定义API地址',
        customApiUrlPlaceholder: '输入自定义API地址（或使用默认地址）',
        apiKeyEmpty: 'API密钥不能为空',
        apiKeyLabel: 'API密钥',
        apiKeyPlaceholder: '在此输入API密钥',
        balanceText: '余额'
      },
      en: {
        validating: 'Validating...',
        saveSuccess: 'Saved successfully',
        apiKeyInvalid: 'The API key is invalid or check if the currently selected model is available.',
        noBalance: 'No balance',
        noApiKey: 'Please set API Key first',
        fetchError: 'Failed to fetch',
        rememberWindowSize: 'Save window size',
        customApiUrlSaveSuccess: 'Custom API URL saved',
        customApiUrlSaveError: 'Failed to save custom API URL',
        customApiUrlLabel: 'Custom API URL',
        customApiUrlPlaceholder: 'Enter custom API URL (or use default)',
        apiKeyEmpty: 'API key cannot be empty',
        apiKeyLabel: 'API Key',
        apiKeyPlaceholder: 'Enter API Key here',
        balanceText: 'Balance'
      }
    };
  }

  getCurrentLang() {
    return localStorage.getItem('preferredLang') || 'en';
  }

  setCurrentLang(lang) {
    localStorage.setItem('preferredLang', lang);
  }

  getTranslation(key) {
    const currentLang = this.getCurrentLang();
    return this.translations[currentLang][key] || key;
  }
}