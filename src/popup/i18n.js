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
        modelIdRequired: '请先填写Model ID'
      },
      en: {
        validating: 'Validating...',
        saveSuccess: 'Saved successfully',
        apiKeyInvalid: 'The API key is invalid or check if the currently selected model is available.',
        noBalance: 'No balance',
        noApiKey: 'Please set API Key first',
        fetchError: 'Failed to fetch',
        rememberWindowSize: 'Save window size',
        modelIdRequired: 'Please enter Model ID first'
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