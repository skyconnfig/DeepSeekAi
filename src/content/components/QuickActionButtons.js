import { createSvgIcon } from "./IconManager";
import { watchThemeChanges } from "../utils/themeManager";

const QUICK_ACTIONS = [
  {
    id: "logo",
    icon: "icon24",
    title: "DeepSeek AI",
  },
  {
    id: "main",
    icon: "icon24",
    title: "Chat",
    prompt: "Please respond in the same language as the user's input. If the user's input is in Chinese, respond in Chinese. If the user's input is in English, respond in English, etc.",
  },
  {
    id: "translate",
    icon: "translate",
    title: "Translate",
    prompt: "Please translate the following content into Simplified Chinese",
    languages: [
      { code: "zh", name: "中文", native: "简体中文" },
      { code: "en", name: "English", native: "English" },
      { code: "ja", name: "Japanese", native: "日本語" },
      { code: "ko", name: "Korean", native: "한국어" },
      { code: "fr", name: "French", native: "Français" },
      { code: "de", name: "German", native: "Deutsch" },
      { code: "es", name: "Spanish", native: "Español" },
      { code: "it", name: "Italian", native: "Italiano" },
      { code: "pt", name: "Portuguese", native: "Português" },
      { code: "ru", name: "Russian", native: "Русский" },
      { code: "ar", name: "Arabic", native: "العربية" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "tr", name: "Turkish", native: "Türkçe" },
      { code: "nl", name: "Dutch", native: "Nederlands" },
      { code: "pl", name: "Polish", native: "Polski" },
      { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
      { code: "th", name: "Thai", native: "ไทย" },
      { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
    ],
  },
  {
    id: "explain",
    icon: "explain",
    title: "Explain",
    prompt: "Your task is to interpret the content input by the user.",
  },
  {
    id: "summarize",
    icon: "summarize",
    title: "Summarize",
    prompt: "Your task is to summarize the content input by the user.",
  },
  {
    id: "email",
    icon: "email",
    title: "Email",
    prompt: "Your task is to write an email based on the user's input.",
  },
  {
    id: "analyze",
    icon: "analyze",
    title: "Analyze",
    prompt: "Your task is to analyze the content entered by the user.",
  },
];

// 获取上次选择的语言
const getLastLanguage = async () => {
  const result = await chrome.storage.sync.get("lastLanguage");
  return result.lastLanguage || "简体中文";
};

// 保存选择的语言
const saveLastLanguage = (language) => {
  chrome.storage.sync.set({ lastLanguage: language });
};

export async function createQuickActionButtons(
  selectedText,
  handleActionClick,
  handleMainClick
) {
  const container = document.createElement("div");
  container.className = "quick-action-buttons";

  // 获取上次选择的语言
  const lastLanguage = await getLastLanguage();

  // 修改翻译按钮的默认 prompt
  const actions = [...QUICK_ACTIONS];
  const translateAction = actions.find((action) => action.id === "translate");
  if (translateAction) {
    translateAction.prompt = `You are a professional multilingual translation engine that provides the ${lastLanguage}：version of user-given content, supporting dynamic context understanding and cross-round memory.Core Functions:Automatically identify the language of input content (if not explicitly specified by the user).Support mutual translation between mainstream languages while preserving the original format (such as poetry, code, glossaries).Record previous translation content, allowing users to make corrections through vague instructions (e.g., "translate the last sentence into French" or "adjust the formality of the last paragraph").Multi-Round Processing Mechanism If no target language is specified by the user, proactively inquire about theirneeds.When users refer to previous text (e.g., "modify wording in the third translation"), accurately locate historical records for precise positioning. Provide differentiated translation suggestions for different styles such as technical documents and colloquial texts.The translation MUST be accurate and natural in ${lastLanguage},You only need to provide the translated text directly, clearly and without any additional explanation or clarification.`;
  }

  // 监听主题变化
  watchThemeChanges((isDark) => {
    const themeVars = {
      "--quick-action-bg": isDark
        ? "rgba(32, 33, 35, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      "--quick-action-text": isDark ? "#ffffff" : "#000000",
      "--quick-action-border": isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
      "--quick-action-shadow": isDark
        ? "0 2px 8px rgba(0, 0, 0, 0.3)"
        : "0 2px 8px rgba(0, 0, 0, 0.1)",
      "--quick-action-hover": isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.05)",
      "--quick-action-icon-filter": isDark
        ? "invert(1) brightness(1.5)"
        : "none",
    };

    Object.entries(themeVars).forEach(([key, value]) => {
      container.style.setProperty(key, value);
    });
  });

  // 基础样式重置
  const resetStyles = {
    boxSizing: "border-box",
    margin: "0",
    padding: "0",
    border: "none",
    font: "inherit",
    verticalAlign: "baseline",
    lineHeight: "1",
    color: "inherit",
  };

  // 容器样式
  Object.assign(container.style, {
    ...resetStyles,
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "4px",
    borderRadius: "12px",
    backgroundColor: "var(--quick-action-bg, rgba(255, 255, 255, 0.95))",
    boxShadow: "var(--quick-action-shadow, 0 2px 8px rgba(0, 0, 0, 0.1))",
    border: "1px solid var(--quick-action-border, rgba(0, 0, 0, 0.1))",
    backdropFilter: "blur(8px)",
    "-webkit-backdrop-filter": "blur(8px)",
    position: "absolute",
    zIndex: "2147483647",
    isolation: "isolate",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    fontSize: "14px",
    lineHeight: "1",
    boxSizing: "content-box",
  });

  // 按钮基础样式
  const buttonBaseStyles = {
    boxSizing: "border-box",
    width: "28px",
    height: "28px",
    padding: "4px",
    margin: "0",
    borderRadius: "6px",
    backgroundColor: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    opacity: "0.7",
    position: "relative",
    outline: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    flexShrink: "0",
    flexGrow: "0",
    border: "none",
  };

  actions.forEach((action) => {
    if (action.id === "logo") {
      const logo = document.createElement("img");
      logo.src = chrome.runtime.getURL("icons/icon24.png");
      logo.className = "quick-action-logo";
      Object.assign(logo.style, {
        ...buttonBaseStyles,
        opacity: "1",
        cursor: "default",
      });
      container.appendChild(logo);
    } else if (action.id === "main") {
      const button = createSvgIcon("icon24", action.title);
      button.className = "quick-action-button";
      Object.assign(button.style, {
        ...buttonBaseStyles,
        filter: "var(--quick-action-icon-filter, none)",
      });

      button.addEventListener("mouseenter", () => {
        button.style.opacity = "1";
        button.style.transform = "scale(1.1)";
        button.style.backgroundColor =
          "var(--quick-action-hover, rgba(0, 0, 0, 0.05))";
      });

      button.addEventListener("mouseleave", () => {
        button.style.opacity = "0.7";
        button.style.transform = "scale(1)";
        button.style.backgroundColor = "transparent";
      });

      button.onclick = (e) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        handleMainClick(e, selectedText, rect); // 直接传递选中文本的位置
      };
      container.appendChild(button);
    } else if (action.id === "translate") {
      const wrapper = document.createElement("div");
      wrapper.className = "quick-action-translate";
      Object.assign(wrapper.style, {
        position: "relative",
        display: "flex",
        alignItems: "center",
      });

      const button = createSvgIcon(action.icon, action.title);
      button.className = "quick-action-button";
      Object.assign(button.style, {
        ...buttonBaseStyles,
        filter: "var(--quick-action-icon-filter, none)",
      });

      const menu = document.createElement("div");
      menu.className = "language-select";
      Object.assign(menu.style, {
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        display: "none",
        marginTop: "2px",
        padding: "2px",
        borderRadius: "12px",
        backgroundColor: "var(--quick-action-bg, rgba(255, 255, 255, 0.95))",
        border: "1px solid var(--quick-action-border, rgba(0, 0, 0, 0.1))",
        boxShadow: "var(--quick-action-shadow, 0 2px 8px rgba(0, 0, 0, 0.1))",
        zIndex: "2147483647",
        width: "auto",
        maxHeight: "400px",
        overflowY: "auto",
        backdropFilter: "blur(8px)",
        "-webkit-backdrop-filter": "blur(8px)",
        display: "none",
        gridTemplateColumns: "1fr",
        gap: "2px",
      });

      // 直接点击翻译按钮时使用上次选择的语言
      button.onclick = () => handleActionClick(action, selectedText);

      action.languages.forEach((lang) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "language-option";
        option.textContent = lang.native;

        // 如果是上次选择的语言，添加高亮样式
        if (lang.native === lastLanguage) {
          Object.assign(option.style, {
            ...resetStyles,
            width: "100%",
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "var(--quick-action-hover, rgba(0, 0, 0, 0.05))",
            border: "none",
            textAlign: "center",
            color: "var(--quick-action-text, #000000)",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
            fontSize: "14px",
            fontWeight: "600",
            lineHeight: "1.4",
            borderRadius: "6px",
          });
        } else {
          Object.assign(option.style, {
            ...resetStyles,
            width: "100%",
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "transparent",
            border: "none",
            textAlign: "center",
            color: "var(--quick-action-text, #000000)",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
            fontSize: "14px",
            fontWeight: "400",
            lineHeight: "1.4",
            borderRadius: "6px",
          });
        }

        option.addEventListener("mouseenter", () => {
          option.style.backgroundColor =
            "var(--quick-action-hover, rgba(0, 0, 0, 0.05))";
          option.style.transform = "scale(1.02)";
        });

        option.addEventListener("mouseleave", () => {
          option.style.backgroundColor =
            lang.native === lastLanguage
              ? "var(--quick-action-hover, rgba(0, 0, 0, 0.05))"
              : "transparent";
          option.style.transform = "scale(1)";
        });

        option.onclick = () => {
          const newAction = {
            ...action,
            prompt: `You are a professional multilingual translation engine that provides the ${lang.native}：version of user-given content, supporting dynamic context understanding and cross-round memory.Core
            Functions:Automatically identify the language of input content (if not explicitly specified by the
            user).Support mutual translation between mainstream languages while preserving the original format
            (such as poetry, code, glossaries).Record previous translation content, allowing users to make
            corrections through vague instructions (e.g., "translate the last sentence into French" or "adjust the
            formality of the last paragraph").Multi-Round Processing Mechanism If no target language is specified
            by the user, proactively inquire about theirneeds.When users refer to previous text (e.g., "modify
            wording in the third translation"), accurately locate historical records for precise positioning.
            Provide differentiated translation suggestions for different styles such as technical documents and
            colloquial texts.The translation MUST be accurate and natural in ${lang.native}.You only need to provide the translated text directly, clearly and without any additional explanation or clarification.`,
          };
          handleActionClick(newAction, selectedText);
          saveLastLanguage(lang.native);
        };

        menu.appendChild(option);
      });

      wrapper.addEventListener("mouseenter", () => {
        menu.style.display = "grid";
        button.style.opacity = "1";
        button.style.transform = "scale(1.1)";
        button.style.backgroundColor =
          "var(--quick-action-hover, rgba(0, 0, 0, 0.05))";
      });

      wrapper.addEventListener("mouseleave", () => {
        menu.style.display = "none";
        button.style.opacity = "0.7";
        button.style.transform = "scale(1)";
        button.style.backgroundColor = "transparent";
      });

      wrapper.appendChild(button);
      wrapper.appendChild(menu);
      container.appendChild(wrapper);
    } else {
      const button = createSvgIcon(action.icon, action.title);
      button.className = "quick-action-button";
      Object.assign(button.style, {
        ...buttonBaseStyles,
        filter: "var(--quick-action-icon-filter, none)",
      });

      button.addEventListener("mouseenter", () => {
        button.style.opacity = "1";
        button.style.transform = "scale(1.1)";
        button.style.backgroundColor =
          "var(--quick-action-hover, rgba(0, 0, 0, 0.05))";
      });

      button.addEventListener("mouseleave", () => {
        button.style.opacity = "0.7";
        button.style.transform = "scale(1)";
        button.style.backgroundColor = "transparent";
      });

      button.onclick = () => handleActionClick(action, selectedText);
      container.appendChild(button);
    }
  });

  return container;
}
