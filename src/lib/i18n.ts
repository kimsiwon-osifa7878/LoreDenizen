import type { AppLanguage, HfRepoFile } from "./types";

export type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    settings: "Settings",
    close: "Close",
    myModels: "My models",
    modelDownload: "Model download",
    language: "Language",
    languageDescription: "Choose the language used across the app.",
    english: "English",
    korean: "Korean",
    noDownloadedModels: "No downloaded models yet.",
    downloadModelsHint: 'Download a model from the "Model download" tab.',
    loaded: "Loaded",
    loading: "Loading...",
    select: "Select",
    delete: "Delete",
    noModelSelected: "No model selected",
    sidebarToggle: "Toggle sidebar",
    newChat: "New chat",
    noConversations: "No conversations yet",
    unknownCharacter: "Unknown character",
    noCharacterSelected: "No character selected",
    deleteConversation: "Delete conversation",
    characters: "Characters",
    newCharacter: "New character",
    editCharacter: "Edit character",
    avatar: "Avatar",
    name: "Name",
    characterName: "Character name",
    description: "Description",
    shortDescription: "Short description",
    tags: "Tags (comma separated)",
    tagsPlaceholder: "tag1, tag2",
    systemPrompt: "System prompt",
    cancel: "Cancel",
    save: "Save",
    startConversation: "Start a conversation",
    messagePlaceholder: "Type a message...",
    stopGeneration: "Stop generation",
    sendMessage: "Send message",
    thinking: "Thinking",
    downloading: "Downloading...",
    sizeUnknown: "Size unknown",
    supported: "Supported",
    unsupported: "Not supported by current wllama",
    unknownCompatibility: "Could not verify compatibility",
    ggufFiles: "GGUF files",
    expand: "Expand",
    collapse: "Collapse",
    ggufFilesEmpty:
      "Select a configured repo or enter one manually to load GGUF files.",
    checkingCompatibility: "Checking GGUF compatibility for {repo}...",
    noGgufFiles: "No GGUF files were found in {repo}.",
    blockedFiles:
      "Some GGUF files are blocked because this browser runtime cannot verify that wllama can load them.",
    architecture: "Architecture",
    unknown: "unknown",
    download: "Download",
    ggufDownloads: "GGUF model downloads",
    ggufDownloadsDescription:
      "Use GGUF models up to 2B parameters. Paste a Hugging Face repository URL or repo path that contains GGUF files, then click Load GGUF to check compatibility and download supported models.",
    openRepoDirectly: "Open repo directly",
    checking: "Checking...",
    loadGguf: "Load GGUF",
    invalidRepo: "Enter the repo as owner/name.",
    configuredRepos: "Configured repos",
    loadingRepoPresets: "Loading repo presets...",
    repoPresetsError: "Could not load repo presets.",
    noConfiguredRepos:
      "Add repo paths to HF_MODELS to show preset repositories here.",
    repoClickHint: "Click to load GGUF files from this repository.",
    ggufFilesError: "Failed to load GGUF files.",
    unsupportedReason:
      "Architecture '{architecture}' is not supported by the current wllama runtime.",
    unknownReason:
      "Architecture '{architecture}' is not in the current wllama compatibility registry.",
    unreadableReason: "Could not read GGUF architecture metadata.",
    newConversationTitle: "New chat",
    modelNotLoaded:
      "A model is not loaded. Download and select a model first.",
    chooseCharacter: "Choose a character",
    chooseCharacterToStart: "Select a character before starting a new chat.",
    setupRequiredTitle: "Conversation setup required",
    setupRequiredDescription:
      "Select a model in Settings, then choose a character to start a new chat.",
    openModelSettings: "Model settings",
    openPersonaEditor: "Persona",
    savePersona: "Save persona",
    selectThisCharacter: "Select",
    uploadImages: "Upload images",
    uploadedImages: "Uploaded images",
    removeImage: "Remove",
    characterRequiredToSend:
      "Choose a character first. Start a new chat and select one.",
  },
  ko: {
    settings: "설정",
    close: "닫기",
    myModels: "내 모델",
    modelDownload: "모델 다운로드",
    language: "언어",
    languageDescription: "앱 전체에 표시할 언어를 선택하세요.",
    english: "영어",
    korean: "한국어",
    noDownloadedModels: "다운로드된 모델이 없습니다.",
    downloadModelsHint: '"모델 다운로드" 탭에서 모델을 다운로드하세요.',
    loaded: "로드됨",
    loading: "로딩...",
    select: "선택",
    delete: "삭제",
    noModelSelected: "모델 미선택",
    sidebarToggle: "사이드바 전환",
    newChat: "새 대화",
    noConversations: "대화가 없습니다",
    unknownCharacter: "알 수 없는 캐릭터",
    noCharacterSelected: "캐릭터 미선택",
    deleteConversation: "대화 삭제",
    characters: "캐릭터",
    newCharacter: "새 캐릭터",
    editCharacter: "캐릭터 편집",
    avatar: "아바타",
    name: "이름",
    characterName: "캐릭터 이름",
    description: "설명",
    shortDescription: "간단한 설명",
    tags: "태그 (쉼표 구분)",
    tagsPlaceholder: "태그1, 태그2",
    systemPrompt: "시스템 프롬프트",
    cancel: "취소",
    save: "저장",
    startConversation: "대화를 시작하세요",
    messagePlaceholder: "메시지를 입력하세요...",
    stopGeneration: "생성 중지",
    sendMessage: "메시지 전송",
    thinking: "생각중",
    downloading: "다운로드 중...",
    sizeUnknown: "크기 알 수 없음",
    supported: "지원됨",
    unsupported: "현재 wllama에서 지원하지 않음",
    unknownCompatibility: "호환성을 확인할 수 없음",
    ggufFiles: "GGUF 파일",
    expand: "펼치기",
    collapse: "접기",
    ggufFilesEmpty:
      "설정된 저장소를 선택하거나 직접 입력하면 GGUF 파일을 불러옵니다.",
    checkingCompatibility: "{repo}의 GGUF 호환성을 확인하는 중...",
    noGgufFiles: "{repo}에서 GGUF 파일을 찾지 못했습니다.",
    blockedFiles:
      "일부 GGUF 파일은 현재 브라우저 런타임에서 wllama 로드 가능 여부를 확인할 수 없어 차단되었습니다.",
    architecture: "아키텍처",
    unknown: "알 수 없음",
    download: "다운로드",
    ggufDownloads: "GGUF 모델 다운로드",
    ggufDownloadsDescription:
      "2B 이하 GGUF 모델을 사용할 수 있습니다. GGUF 파일이 있는 Hugging Face 저장소 URL 또는 repo path를 붙여넣고 Load GGUF를 누르면 호환성을 확인한 뒤 지원되는 모델을 다운로드할 수 있습니다.",
    openRepoDirectly: "저장소 직접 열기",
    checking: "확인 중...",
    loadGguf: "Load GGUF",
    invalidRepo: "owner/name 형식으로 저장소를 입력하세요.",
    configuredRepos: "설정된 저장소",
    loadingRepoPresets: "저장소 프리셋을 불러오는 중...",
    repoPresetsError: "저장소 프리셋을 불러오지 못했습니다.",
    noConfiguredRepos:
      "HF_MODELS에 repo path를 추가하면 프리셋 저장소가 여기에 표시됩니다.",
    repoClickHint: "이 저장소에서 GGUF 파일을 불러오려면 클릭하세요.",
    ggufFilesError: "GGUF 파일을 불러오지 못했습니다.",
    unsupportedReason:
      "'{architecture}' 아키텍처는 현재 wllama 런타임에서 지원되지 않습니다.",
    unknownReason:
      "'{architecture}' 아키텍처는 현재 wllama 호환성 목록에 없습니다.",
    unreadableReason: "GGUF 아키텍처 메타데이터를 읽을 수 없습니다.",
    newConversationTitle: "새 대화",
    modelNotLoaded:
      "모델이 로드되지 않았습니다. 모델을 먼저 다운로드하고 선택해주세요.",
    chooseCharacter: "캐릭터 선택",
    chooseCharacterToStart: "새 대화를 시작하기 전에 캐릭터를 선택하세요.",
    setupRequiredTitle: "대화 준비가 필요합니다",
    setupRequiredDescription:
      "설정에서 모델을 선택하고, 새 대화에서 캐릭터를 선택하세요.",
    openModelSettings: "모델 설정",
    openPersonaEditor: "페르소나",
    savePersona: "페르소나 저장",
    selectThisCharacter: "선택",
    uploadImages: "이미지 업로드",
    uploadedImages: "업로드된 이미지",
    removeImage: "삭제",
    characterRequiredToSend:
      "먼저 캐릭터를 선택하세요. 새 대화에서 캐릭터를 고른 뒤 메시지를 보낼 수 있습니다.",
  },
} as const;

export function t(
  language: AppLanguage,
  key: TranslationKey,
  values: Record<string, string> = {}
): string {
  let text: string = translations[language][key] ?? translations.en[key];

  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, value);
  }

  return text;
}

export function getCompatibilityLabel(
  language: AppLanguage,
  file: HfRepoFile
): string {
  if (file.compatibility === "supported") {
    return t(language, "supported");
  }

  if (file.compatibility === "unsupported") {
    return t(language, "unsupported");
  }

  return t(language, "unknownCompatibility");
}

export function getCompatibilityReason(
  language: AppLanguage,
  file: HfRepoFile
): string | null {
  if (file.compatibility === "supported") {
    return null;
  }

  if (!file.architecture) {
    return t(language, "unreadableReason");
  }

  if (file.compatibility === "unsupported") {
    return t(language, "unsupportedReason", {
      architecture: file.architecture,
    });
  }

  return t(language, "unknownReason", {
    architecture: file.architecture,
  });
}
