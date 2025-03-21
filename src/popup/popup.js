import { ApiKeyManager } from './apiKeyManager.js';
import { BalanceManager } from './balanceManager.js';
import { I18nManager } from './i18n.js';
import { UiManager } from './uiManager.js';
import { StorageManager } from './storageManager.js';

class PopupManager {
  constructor() {
    this.apiKeyManager = new ApiKeyManager();
    this.balanceManager = new BalanceManager();
    this.i18nManager = new I18nManager();
    this.uiManager = new UiManager();
    this.storageManager = new StorageManager();

    // 确保DOM完全加载后再初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeEventListeners();
        this.loadInitialState();
      });
    } else {
      this.initializeEventListeners();
      this.loadInitialState();
    }
  }

  async loadInitialState() {
    const settings = await this.storageManager.getSettings();
    const currentProvider = settings.provider || 'deepseek';

    // 根据当前服务商设置API key
    const apiKey = await this.apiKeyManager.getApiKey(currentProvider);
    if (apiKey) {
      this.uiManager.setApiKeyValue(apiKey);
      this.apiKeyManager.lastValidatedValue = apiKey;
      if (currentProvider === 'deepseek') {
        this.handleBalanceRefresh();
      }
    }

    this.uiManager.elements.languageSelect.value = settings.language;
    this.uiManager.elements.providerSelect.value = currentProvider;
    this.uiManager.elements.selectionEnabled.checked = settings.selectionEnabled;
    this.uiManager.elements.rememberWindowSize.checked = settings.rememberWindowSize;
    this.uiManager.elements.pinWindow.checked = settings.pinWindow;

    // 根据provider显示/隐藏相关元素并更新model选项
    this.updateProviderUI(currentProvider);

    // 在更新完model选项后，设置保存的model值
    if (settings.model) {
      this.uiManager.elements.modelSelect.value = settings.model;
    }

    // 设置自定义API URL和默认URL（不使用setTimeout）
    this.loadCustomApiUrl(currentProvider);
  }

  // 新增方法：加载自定义API URL
  async loadCustomApiUrl(currentProvider) {
    try {
      // 确保元素已正确获取
      this.uiManager.refreshElements();

      // 获取自定义API URL
      const customApiUrl = await this.apiKeyManager.getCustomApiUrl(currentProvider);
      const defaultUrl = this.apiKeyManager.getDefaultApiUrl(currentProvider);

      // 设置默认URL作为placeholder
      this.uiManager.setCustomApiUrlPlaceholder(defaultUrl);

      // 如果有自定义URL，设置到输入框
      if (customApiUrl) {
        this.uiManager.setCustomApiUrlValue(customApiUrl);
      }

      // 更新界面标签语言
      this.updateLabels();

      // 调用全局updateContent确保所有翻译一致
      updateContent();
    } catch (error) {
      console.error('加载自定义API URL出错:', error);
    }
  }

  initializeEventListeners() {
    // API Key visibility toggle
    this.uiManager.elements.toggleButton.addEventListener(
      "click",
      () => this.uiManager.toggleApiKeyVisibility()
    );

    // API Key validation
    this.uiManager.elements.apiKeyInput.addEventListener(
      "blur",
      () => this.handleApiKeyValidation()
    );

    // 自定义API URL保存
    this.uiManager.elements.customApiUrlInput.addEventListener(
      "blur",
      () => this.handleCustomApiUrlSave()
    );

    // Provider selection
    this.uiManager.elements.providerSelect.addEventListener(
      "change",
      async (e) => {
        const provider = e.target.value;
        await this.storageManager.saveProvider(provider);
        this.updateProviderUI(provider);

        // 切换服务商时加载对应的API key
        const apiKey = await this.apiKeyManager.getApiKey(provider);
        this.uiManager.setApiKeyValue(apiKey || '');
        this.apiKeyManager.lastValidatedValue = apiKey || '';

        // 加载对应的自定义API URL（使用新方法）
        this.loadCustomApiUrl(provider);
      }
    );

    // Language selection
    this.uiManager.elements.languageSelect.addEventListener(
      "change",
      (e) => {
        this.storageManager.saveLanguage(e.target.value);
        this.updateLabels();
      }
    );

    // Model selection
    this.uiManager.elements.modelSelect.addEventListener(
      "change",
      (e) => this.storageManager.saveModel(e.target.value)
    );

    // Selection enabled toggle
    this.uiManager.elements.selectionEnabled.addEventListener(
      "change",
      (e) => this.storageManager.saveSelectionEnabled(e.target.checked)
    );

    // Remember window size toggle
    this.uiManager.elements.rememberWindowSize.addEventListener(
      "change",
      (e) => this.storageManager.saveRememberWindowSize(e.target.checked)
    );

    // Pin window toggle
    this.uiManager.elements.pinWindow.addEventListener(
      "change",
      (e) => this.storageManager.savePinWindow(e.target.checked)
    );

    // Balance toggle
    this.uiManager.elements.balanceToggle.addEventListener(
      "click",
      () => this.handleBalanceToggle()
    );

    this.uiManager.elements.totalBalance.addEventListener(
      "click",
      () => this.handleBalanceToggle()
    );

    // Shortcut settings
    document.getElementById('shortcutSettings').addEventListener(
      'click',
      (e) => this.handleShortcutSettings(e)
    );

    // Instructions link
    document.getElementById('instructionsLink').addEventListener(
      'click',
      (e) => this.handleInstructionsLink(e)
    );
  }

  updateProviderUI(provider) {
    // 显示/隐藏余额相关元素
    const balanceSection = document.querySelector('.balance-section');
    balanceSection.style.display = provider === 'deepseek' ? 'flex' : 'none';

    // 更新 API Key 链接
    const apiKeyLink = document.getElementById('apiKeyLink');
    const providerUrls = {
      'deepseek': 'https://platform.deepseek.com/api_keys',
      'siliconflow': 'https://cloud.siliconflow.cn/i/lStn36vH',
      'openrouter': 'https://openrouter.ai/settings/keys',
      'volcengine': 'https://www.volcengine.com/experience/ark?utm_term=202502dsinvite&ac=DSASUQY5&rc=OXTHJAF8',
      'tencentcloud': 'https://console.cloud.tencent.com/lkeap/api',
      'iflytekstar': 'https://training.xfyun.cn/modelService',
      'baiducloud': 'https://console.bce.baidu.com/iam/#/iam/apikey/create',
      'aliyun': 'https://bailian.console.aliyun.com/?apiKey=1#/api-key',
      'aihubmix': 'https://aihubmix.com/token',
    };
    apiKeyLink.href = providerUrls[provider] || providerUrls['deepseek'];

    // 更新model选项
    this.updateModelOptions(provider);
  }

  updateModelOptions(provider) {
    const modelSelect = this.uiManager.elements.modelSelect;
    const currentValue = modelSelect.value; // 保存当前选中的值
    modelSelect.innerHTML = ''; // 清空现有选项

    const modelOptions = {
      'deepseek': [
        { value: 'deepseek-chat', label: 'DeepSeek-V3' },
        { value: 'deepseek-reasoner', label: 'DeepSeek-R1' }
      ],
      'siliconflow': [
        { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3' },
        { value: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek-R1' },
        { value: 'Pro/deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3 Pro' },
        { value: 'Pro/deepseek-ai/DeepSeek-R1', label: 'DeepSeek-R1 Pro' },
      ],
      'openrouter': [
        { value: 'deepseek/deepseek-chat', label: 'DeepSeek-V3' },
        { value: 'deepseek/deepseek-r1', label: 'DeepSeek-R1' },
        { value: 'deepseek/deepseek-chat:free', label: 'DeepSeek-V3 Free' },
        { value: 'deepseek/deepseek-r1:free', label: 'DeepSeek-R1 Free' },
      ],
      'volcengine': [
        { value: 'deepseek-v3-241226', label: 'DeepSeek-V3' },
        { value: 'deepseek-r1-250120', label: 'DeepSeek-R1' }
      ],
      'tencentcloud': [
        { value: 'deepseek-v3', label: 'DeepSeek-V3' },
        { value: 'deepseek-r1', label: 'DeepSeek-R1' }
      ],
      'iflytekstar': [
        { value: 'xdeepseekv3', label: 'DeepSeek-V3' },
        { value: 'xdeepseekr1', label: 'DeepSeek-R1' }
      ],
      'baiducloud': [
        { value: 'deepseek-v3', label: 'DeepSeek-V3' },
        { value: 'deepseek-r1', label: 'DeepSeek-R1' }
      ],
      'aliyun': [
        { value: 'deepseek-v3', label: 'DeepSeek-V3' },
        { value: 'deepseek-r1', label: 'DeepSeek-R1' }
      ],
      'aihubmix': [
        { value: 'deepseek-reasoner', label: 'DeepSeek-R1 DeepSeek' },
        { value: 'deepseek-chat', label: 'DeepSeek-V3 DeepSeek' },
        { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3 Other' },
        { value: 'aihubmix-DeepSeek-R1', label: 'DeepSeek-R1 Azure' },
        { value: 'DeepSeek-R1', label: 'DeepSeek-R1 Aliyun&ByteDance' },
        { value: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek-R1 Mix' },
      ]
    };

    const options = modelOptions[provider] || [];
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      modelSelect.appendChild(optionElement);
    });

    // 获取保存的模型设置
    this.storageManager.getSettings().then(settings => {
      // 如果当前provider下有保存的model值，则使用它
      if (settings.model && options.some(opt => opt.value === settings.model)) {
        modelSelect.value = settings.model;
      } else {
        // 如果没有保存的值或值无效，使用第一个选项并保存
        modelSelect.value = options[0]?.value || '';
        this.storageManager.saveModel(modelSelect.value);
      }
    });
  }

  async handleApiKeyValidation() {
    const apiKey = this.uiManager.getApiKeyValue();
    const provider = this.uiManager.elements.providerSelect.value;

    if (!apiKey) {
      this.uiManager.showMessage(
        this.i18nManager.getTranslation('apiKeyEmpty'),
        false
      );
      return;
    }

    // 显示验证中的消息
    this.uiManager.showMessage(
      this.i18nManager.getTranslation('validating'),
      true
    );

    try {
      const settings = {
        model: this.uiManager.elements.modelSelect.value,
      };

      const isValid = await this.apiKeyManager.validateApiKey(apiKey, provider, settings);

      if (isValid) {
        this.uiManager.showMessage(
          this.i18nManager.getTranslation('saveSuccess'),
          true
        );
        if (provider === 'deepseek') {
          this.handleBalanceRefresh();
        }
      } else {
        this.uiManager.showMessage(
          this.i18nManager.getTranslation('apiKeyInvalid'),
          false
        );
      }
    } catch (error) {
      console.error('API validation error:', error);
      this.uiManager.showMessage(
        this.i18nManager.getTranslation('fetchError'),
        false
      );
    }
  }

  async handleBalanceRefresh() {
    if (this.balanceManager.isLoading()) return;

    const apiKey = await this.apiKeyManager.getApiKey('deepseek');

    if (!apiKey) {
      this.uiManager.elements.totalBalance.textContent =
        this.i18nManager.getTranslation('noApiKey');
      return;
    }

    this.balanceManager.setLoading(true);
    this.uiManager.showLoadingState();

    try {
      const balanceData = await this.balanceManager.fetchBalance(apiKey);
      this.uiManager.updateBalanceDisplay(
        balanceData,
        this.i18nManager.getTranslation('noBalance')
      );
    } catch (error) {
      this.uiManager.elements.totalBalance.textContent =
        this.i18nManager.getTranslation('fetchError');
    } finally {
      this.balanceManager.setLoading(false);
    }
  }

  handleBalanceToggle() {
    const isVisible = this.uiManager.toggleBalance();
    if (isVisible && this.uiManager.elements.totalBalance.textContent === '--') {
      this.handleBalanceRefresh();
    }
  }

  handleShortcutSettings(e) {
    e.preventDefault();
    chrome.tabs.create({
      url: "chrome://extensions/shortcuts"
    });
  }

  async handleInstructionsLink(e) {
    e.preventDefault();
    const instructionsUrl = chrome.runtime.getURL('Instructions/Instructions.html');
    chrome.tabs.create({
      url: instructionsUrl
    });
  }

  // 处理自定义API URL的保存
  async handleCustomApiUrlSave() {
    const customApiUrl = this.uiManager.getCustomApiUrlValue();
    const provider = this.uiManager.elements.providerSelect.value;

    try {
      await this.apiKeyManager.saveCustomApiUrl(customApiUrl, provider);

      // 如果自定义URL为空，显示默认URL作为placeholder
      if (!customApiUrl) {
        const defaultUrl = this.apiKeyManager.getDefaultApiUrl(provider);
        this.uiManager.setCustomApiUrlPlaceholder(defaultUrl);
      }

      this.uiManager.showMessage(
        this.i18nManager.getTranslation('customApiUrlSaveSuccess'),
        true
      );
    } catch (error) {
      console.error('保存自定义API URL错误:', error);
      this.uiManager.showMessage(
        this.i18nManager.getTranslation('customApiUrlSaveError'),
        false
      );
    }
  }

  updateLabels() {
    try {
      // 确保元素已正确获取
      this.uiManager.refreshElements();

      // 获取当前语言
      const currentLang = this.i18nManager.getCurrentLang();

      // 更新接口上的所有文本为当前语言
      const elements = {
        'apiKeyLabelText': 'apiKeyLabel',
        'balanceText': 'balanceText',
        'rememberWindowSizeLabel': 'rememberWindowSize',
        'customApiUrlLabel': 'customApiUrlLabel'
      };

      // 批量更新元素文本
      Object.entries(elements).forEach(([elementId, translationKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
          element.textContent = this.i18nManager.getTranslation(translationKey) ||
                               (currentLang === 'zh' ? '自定义API地址' : 'Custom API URL');
        }
      });

      // 更新输入框placeholder
      const inputElements = {
        'apiKey': 'apiKeyPlaceholder',
        'customApiUrl': 'customApiUrlPlaceholder'
      };

      // 批量更新输入框placeholder
      Object.entries(inputElements).forEach(([elementId, translationKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
          // 为自定义API URL保留其特殊逻辑
          if (elementId === 'customApiUrl') {
            // 获取当前provider
            const provider = this.uiManager.elements.providerSelect?.value;
            if (provider) {
              const defaultUrl = this.apiKeyManager.getDefaultApiUrl(provider);
              if (defaultUrl) {
                element.placeholder = defaultUrl;
                return;
              }
            }
          }

          // 其他元素使用默认翻译逻辑
          const defaultValue = currentLang === 'zh' ?
            '输入自定义API地址（或使用默认地址）' :
            'Enter custom API URL (or use default)';
          element.placeholder = this.i18nManager.getTranslation(translationKey) || defaultValue;
        }
      });
    } catch (error) {
      console.error('Error updating labels:', error);
    }
  }
}

// 创建全局PopupManager实例，确保全局可访问
let popupManagerInstance;

// 界面国际化语言切换
document.getElementById('language-toggle')?.addEventListener('click', () => {
  const currentLang = getCurrentLang();
  const newLang = currentLang === 'zh' ? 'en' : 'zh';
  setCurrentLang(newLang);

  // 更新全部UI文本
  updateContent();
  // 同时通过PopupManager实例更新标签
  if (popupManagerInstance) {
    popupManagerInstance.updateLabels();
  }
});

// 使用DOMContentLoaded确保DOM加载后初始化
document.addEventListener("DOMContentLoaded", () => {
  popupManagerInstance = new PopupManager();
  // 保存到window对象，便于访问
  window.popupManagerInstance = popupManagerInstance;
  // 初始化界面语言
  updateContent();
});

// 语言切换功能
const translations = {
  zh: {
    headerTitle: "DeepSeek AI",
    apiKeyPlaceholder: "在此输入 API Key",
    apiKeyLink: "前往获取 API Key",
    preferredLanguageLabel: "首选语言",
    providerLabel: "服务提供商",
    modelLabel: "模型选择",
    saveButton: "保存",
    shortcutSettingsText: "快捷键设置",
    shortcutDescription: "请前往设置快捷键",
    instructionsText: "使用说明",
    feedbackText: "反馈",
    statusText: "API 服务状态",
    balanceText: "余额",
    noBalance: "无可用余额",
    noApiKey: "请先设置API Key",
    fetchError: "查询失败",
    apiKeyEmpty: "请输入 API Key",
    apiKeyInvalid: "API密钥无效或检查当前所选模型是否可用",
    saveSuccess: "设置已保存",
    selectionEnabledLabel: "快捷按钮",
    selectionEnabledTip: "选中文本后显示快捷按钮，点击可快速打开会话窗口",
    validating: "正在验证...",
    rememberWindowSizeLabel: "保存窗口大小",
    rememberWindowSizeTip: "记住您调整后的会话窗口大小，下次打开时将保持相同尺寸",
    pinWindowLabel: "固定窗口",
    pinWindowTip: "开启后，点击窗口外部不会自动关闭会话窗口",
    warningMessage: "部分服务商API如若不能正常使用请切换服务商",
    // 火山引擎相关
    volcengineProvider: "火山引擎",
    siliconflowProvider: "硅基流动",
    tencentcloudProvider: "腾讯云",
    iflytekstarProvider: "讯飞星辰",
    baiducloudProvider: "百度智能云",
    aliyunProvider: "阿里云",
    aihubmixProvider: "AIHubMix",
    huaweicloudProvider: "华为云",
    customApiUrlLabel: "自定义API地址",
    customApiUrlPlaceholder: "输入自定义API地址（或使用默认地址）",
    customApiUrlSaveSuccess: "自定义API地址保存成功",
    customApiUrlSaveError: "保存自定义API地址时出错",
    apiKeyLabel: "API密钥",
  },
  en: {
    headerTitle: "DeepSeek AI",
    apiKeyPlaceholder: "Enter API Key here",
    apiKeyLink: "Get API Key",
    preferredLanguageLabel: "Preferred Language",
    providerLabel: "Service Provider",
    modelLabel: "Model Selection",
    saveButton: "Save",
    shortcutSettingsText: "Shortcut Settings",
    shortcutDescription: "Please configure shortcut keys",
    instructionsText: "Instructions",
    feedbackText: "Feedback",
    statusText: "API Service Status",
    balanceText: "Balance",
    noBalance: "No available balance",
    noApiKey: "Please set API Key first",
    fetchError: "Failed to fetch",
    apiKeyEmpty: "Please enter API Key",
    apiKeyInvalid: "The API key is invalid or check if the currently selected model is available.",
    saveSuccess: "Settings saved",
    selectionEnabledLabel: "Quick Button",
    selectionEnabledTip: "Show a quick button when text is selected to open the chat window",
    validating: "Validating...",
    rememberWindowSizeLabel: "Save Window Size",
    rememberWindowSizeTip: "Remember your preferred chat window size for future sessions",
    pinWindowLabel: "Pin Window",
    pinWindowTip: "When enabled, clicking outside the window won't close it",
    warningMessage: "If some service provider APIs cannot be used normally, please switch providers.",
    // Volcengine related
    volcengineProvider: "Volcano Engine",
    siliconflowProvider: "SiliconFlow",
    tencentcloudProvider: "Tencent Cloud",
    iflytekstarProvider: "IFlytek Star",
    baiducloudProvider: "Baidu Cloud",
    aihubmixProvider: "AIHubMix",
    aliyunProvider: "Aliyun",
    huaweicloudProvider: "Huawei Cloud",
    customApiUrlLabel: "Custom API URL",
    customApiUrlPlaceholder: "Enter custom API URL (or use default)",
    customApiUrlSaveSuccess: "Custom API URL saved successfully",
    customApiUrlSaveError: "Error saving custom API URL",
    apiKeyLabel: "API Key",
  },
};

// 使用localStorage存储语言偏好
const getCurrentLang = () => localStorage.getItem('preferredLang') || 'en';
const setCurrentLang = (lang) => localStorage.setItem('preferredLang', lang);

// 更新页面内容
const updateContent = () => {
  const currentLang = getCurrentLang();
  const langData = translations[currentLang];

  // 更新警告信息
  const warningText = document.getElementById('warningText');
  if (warningText) {
    warningText.textContent = langData.warningMessage;
  }

  // 使用现代的DOM操作方法
  const elements = {
    'header-title': langData.headerTitle,
    'apiKey': { placeholder: langData.apiKeyPlaceholder },
    'apiKeyLink': langData.apiKeyLink,
    'preferredLanguageLabel': langData.preferredLanguageLabel,
    'providerLabel': langData.providerLabel,
    'modelLabel': langData.modelLabel,
    'saveButton': langData.saveButton,
    'shortcutSettingsText': langData.shortcutSettingsText,
    'shortcutDescription': langData.shortcutDescription,
    'instructionsText': langData.instructionsText,
    'feedbackText': langData.feedbackText,
    'statusText': langData.statusText,
    'balanceText': langData.balanceText,
    'selectionEnabledLabel': langData.selectionEnabledLabel,
    'rememberWindowSizeLabel': langData.rememberWindowSizeLabel,
    'pinWindowLabel': langData.pinWindowLabel,
    // 增加API密钥和自定义API URL标签
    'apiKeyLabelText': langData.apiKeyLabel,
    'customApiUrlLabel': langData.customApiUrlLabel,
    // 火山引擎相关
    'volcengineProvider': langData.volcengineProvider,
    'siliconflowProvider': langData.siliconflowProvider,
    'tencentcloudProvider': langData.tencentcloudProvider,
    'iflytekstarProvider': langData.iflytekstarProvider,
    'baiducloudProvider': langData.baiducloudProvider,
    'aliyunProvider': langData.aliyunProvider,
    'aihubmixProvider': langData.aihubmixProvider,
    'huaweicloudProvider': langData.huaweicloudProvider,
  };

  // 批量更新DOM
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      if (typeof value === 'object') {
        // 特殊处理customApiUrl，不更新其placeholder
        if (id === 'customApiUrl') {
          // 只更新非placeholder属性
          Object.entries(value).forEach(([attr, attrValue]) => {
            if (attr !== 'placeholder') {
              element[attr] = attrValue;
            }
          });
        } else {
          // 其他输入框正常更新所有属性
          Object.entries(value).forEach(([attr, attrValue]) => {
            element[attr] = attrValue;
          });
        }
      } else {
        element.textContent = value;
      }
    }
  });

  // 如果popupManagerInstance存在，确保自定义API URL的placeholder保持正确
  if (window.popupManagerInstance && document.getElementById('customApiUrl')) {
    const provider = document.getElementById('provider')?.value;
    if (provider) {
      const apiKeyManager = window.popupManagerInstance.apiKeyManager;
      const defaultUrl = apiKeyManager.getDefaultApiUrl(provider);
      if (defaultUrl) {
        document.getElementById('customApiUrl').placeholder = defaultUrl;
      }
    }
  }

  // 更新开关按钮的提示文本
  const switchTips = {
    'selectionEnabledLabel': langData.selectionEnabledTip,
    'rememberWindowSizeLabel': langData.rememberWindowSizeTip,
    'pinWindowLabel': langData.pinWindowTip
  };

  Object.entries(switchTips).forEach(([id, tip]) => {
    const element = document.getElementById(id);
    if (element) {
      element.setAttribute('data-tooltip', tip);
    }
  });

  // 更新余额显示的文本（如果有错误状态）
  const balanceElement = document.getElementById('totalBalance');
  if (balanceElement) {
    const balanceText = balanceElement.textContent;
    const errorMessages = {
      '无可用余额': langData.noBalance,
      '请先设置API Key': langData.noApiKey,
      '查询失败': langData.fetchError,
    };

    if (errorMessages[balanceText]) {
      balanceElement.textContent = errorMessages[balanceText];
    }
  }

  // 更新select的值
  document.getElementById('language').value = currentLang;
};

// 监听语言选择器的change事件，用于大模型语言设置
document.getElementById('language').addEventListener('change', (e) => {
  // 这里不需要调用 setCurrentLang 和 updateContent
  // 因为这个选择器只用于设置大模型的回复语言
  // 实际的保存会在点击保存按钮时进行
});
