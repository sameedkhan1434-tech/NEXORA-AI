import type { UILanguage } from '../types/chat';

export interface StarterPrompt {
  title: string;
  description: string;
  prompt: string;
}

export interface UITranslations {
  dir: 'ltr' | 'rtl';
  brandName: string;
  modelFast: string;
  modelFastDesc: string;
  modelThinking: string;
  modelThinkingDesc: string;
  modelCode: string;
  modelCodeDesc: string;
  newChat: string;
  temporaryChat: string;
  temporaryChatBanner: string;
  sharedChatBanner: string;
  continueChat: string;
  searchPlaceholder: string;
  noChatsYet: string;
  noSearchResults: string;
  today: string;
  yesterday: string;
  previous7Days: string;
  older: string;
  rename: string;
  delete: string;
  clearAll: string;
  confirmClearAll: string;
  cancel: string;
  confirm: string;
  settings: string;
  settingsGeneral: string;
  settingsPersonalization: string;
  aboutUserLabel: string;
  aboutUserPlaceholder: string;
  customInstructionsLabel: string;
  customInstructionsHint: string;
  customInstructionsPlaceholder: string;
  enableCustomInstructions: string;
  save: string;
  saved: string;
  interfaceLanguage: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  welcomeSubtitle: string;
  composerPlaceholder: string;
  attachFile: string;
  webSearch: string;
  voiceInput: string;
  stopRecording: string;
  transcribing: string;
  voiceChat: string;
  voiceConnecting: string;
  voiceListening: string;
  voiceSpeaking: string;
  voiceProcessing: string;
  voiceMuted: string;
  voiceEnd: string;
  voiceMute: string;
  voiceUnmute: string;
  voiceFallbackHint: string;
  voiceHoldHint: string;
  micError: string;
  send: string;
  stop: string;
  disclaimer: string;
  copy: string;
  copied: string;
  preview: string;
  code: string;
  readAloud: string;
  stopReading: string;
  loadingAudio: string;
  goodResponse: string;
  badResponse: string;
  regenerate: string;
  edit: string;
  saveAndSend: string;
  retry: string;
  you: string;
  assistantName: string;
  thinking: string;
  sources: string;
  untitledChat: string;
  shareChat: string;
  shareTitle: string;
  shareDescription: string;
  copyLink: string;
  linkCopied: string;
  copyTranscript: string;
  shareNative: string;
  exportChat: string;
  exportMarkdown: string;
  exportText: string;
  exportedOn: string;
  attachmentErrorSize: string;
  attachmentErrorType: string;
  starterPrompts: StarterPrompt[];
}

export const TRANSLATIONS: Record<UILanguage, UITranslations> = {
  en: {
    dir: 'ltr',
    brandName: 'NEXORA',
    modelFast: 'NEXORA Fast',
    modelFastDesc: 'Answers right away for everyday tasks',
    modelThinking: 'NEXORA Thinking',
    modelThinkingDesc: 'Thinks longer for complex reasoning & analysis',
    modelCode: 'NEXORA Code',
    modelCodeDesc: 'Senior coding assistant with live HTML/SVG previews',
    newChat: 'New chat',
    temporaryChat: 'Temporary chat',
    temporaryChatBanner: 'Temporary chat — not saved to your history',
    sharedChatBanner: 'Viewing a shared conversation snapshot',
    continueChat: 'Continue this chat',
    searchPlaceholder: 'Search chats...',
    noChatsYet: 'Your conversations will appear here.',
    noSearchResults: 'No matching conversations found.',
    today: 'Today',
    yesterday: 'Yesterday',
    previous7Days: 'Previous 7 days',
    older: 'Older',
    rename: 'Rename',
    delete: 'Delete',
    clearAll: 'Clear all chats',
    confirmClearAll: 'Delete all conversations?',
    cancel: 'Cancel',
    confirm: 'Delete all',
    settings: 'Settings',
    settingsGeneral: 'General',
    settingsPersonalization: 'Custom instructions',
    aboutUserLabel: 'What would you like NEXORA to know about you?',
    aboutUserPlaceholder: 'Example: I am a software developer working with React and Python...',
    customInstructionsLabel: 'How would you like NEXORA to respond?',
    customInstructionsHint: 'Applied to all new messages when enabled.',
    customInstructionsPlaceholder: 'Example: Keep explanations concise, use TypeScript for code examples, and explain step-by-step...',
    enableCustomInstructions: 'Enable for new chats',
    save: 'Save',
    saved: 'Saved',
    interfaceLanguage: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    greetingMorning: 'What can I help with?',
    greetingAfternoon: 'What can I help with?',
    greetingEvening: 'What can I help with?',
    welcomeSubtitle: 'Ask anything in English, Urdu, or Hindi — with voice chat, PDF & file analysis, web search, and coding previews.',
    composerPlaceholder: 'Ask anything',
    attachFile: 'Add photos, PDFs & files',
    webSearch: 'Search',
    voiceInput: 'Dictate',
    stopRecording: 'Stop recording',
    transcribing: 'Transcribing...',
    voiceChat: 'Voice chat',
    voiceConnecting: 'Connecting voice...',
    voiceListening: 'Listening...',
    voiceSpeaking: 'NEXORA is speaking...',
    voiceProcessing: 'Thinking...',
    voiceMuted: 'Microphone muted',
    voiceEnd: 'End voice chat',
    voiceMute: 'Mute',
    voiceUnmute: 'Unmute',
    voiceFallbackHint: 'Tap mic to speak your turn, tap again to send.',
    voiceHoldHint: 'Speak naturally in English, Urdu, or Hindi.',
    micError: 'Microphone access is unavailable.',
    send: 'Send message',
    stop: 'Stop generating',
    disclaimer: 'NEXORA can make mistakes. Check important info.',
    copy: 'Copy',
    copied: 'Copied',
    preview: 'Preview',
    code: 'Code',
    readAloud: 'Read aloud',
    stopReading: 'Stop',
    loadingAudio: 'Loading audio...',
    goodResponse: 'Good response',
    badResponse: 'Bad response',
    regenerate: 'Regenerate',
    edit: 'Edit',
    saveAndSend: 'Send',
    retry: 'Retry',
    you: 'You',
    assistantName: 'NEXORA',
    thinking: 'Thinking...',
    sources: 'Sources',
    untitledChat: 'New chat',
    shareChat: 'Share',
    shareTitle: 'Share & export conversation',
    shareDescription: 'Share a link to this chat or save a copy to your device.',
    copyLink: 'Copy share link',
    linkCopied: 'Link copied',
    copyTranscript: 'Copy transcript',
    shareNative: 'Share via device...',
    exportChat: 'Export',
    exportMarkdown: 'Download Markdown (.md)',
    exportText: 'Download Plain Text (.txt)',
    exportedOn: 'Exported on',
    attachmentErrorSize: 'File exceeds the 10 MB limit.',
    attachmentErrorType: 'Please attach an image, PDF, or plain text/code file.',
    starterPrompts: [
      {
        title: 'Write & refine',
        description: 'Draft an executive email or polish an article with clear tone',
        prompt: 'Help me write a concise, persuasive project update email to stakeholders about an upcoming product launch.',
      },
      {
        title: 'Build interactive UI',
        description: 'Generate clean HTML/CSS/JS widgets with live preview',
        prompt: 'Create a sleek interactive Pomodoro timer card in a single HTML code block with clean CSS and JavaScript so I can preview it live.',
      },
      {
        title: 'Translate across scripts',
        description: 'Natural translation between English, Urdu, and Hindi',
        prompt: 'Translate the following message into both natural Urdu and polite Hindi, keeping the tone warm and professional: "Thank you for your thoughtful collaboration on this initiative."',
      },
      {
        title: 'Analyze PDFs & files',
        description: 'Attach a PDF, CSV, or code file to summarize and ask questions',
        prompt: 'Compare renewable energy storage technologies (lithium-ion, solid-state, pumped hydro, and green hydrogen) in a clear structured table.',
      },
    ],
  },
  ur: {
    dir: 'rtl',
    brandName: 'NEXORA',
    modelFast: 'NEXORA Fast',
    modelFastDesc: 'روزمرہ سوالات کے لیے فوری جوابات',
    modelThinking: 'NEXORA Thinking',
    modelThinkingDesc: 'مشکل مسائل اور تجزیے کے لیے گہرا غور و فکر',
    modelCode: 'NEXORA Code',
    modelCodeDesc: 'لائیو HTML/SVG پریویو کے ساتھ ماہر کوڈنگ اسسٹنٹ',
    newChat: 'نئی چیٹ',
    temporaryChat: 'عارضی چیٹ',
    temporaryChatBanner: 'عارضی چیٹ — یہ گفتگو تاریخ میں محفوظ نہیں ہوگی',
    sharedChatBanner: 'آپ ایک شیئر کی گئی گفتگو دیکھ رہے ہیں',
    continueChat: 'اس چیٹ کو جاری رکھیں',
    searchPlaceholder: 'چیٹس تلاش کریں...',
    noChatsYet: 'آپ کی تمام گفتگو یہاں محفوظ ہوں گی۔',
    noSearchResults: 'کوئی مماثل گفتگو نہیں ملی۔',
    today: 'آج',
    yesterday: 'کل',
    previous7Days: 'گزشتہ 7 دن',
    older: 'پُرانی',
    rename: 'نام بدلیں',
    delete: 'حذف کریں',
    clearAll: 'تمام چیٹس صاف کریں',
    confirmClearAll: 'تمام گفتگو حذف کر دیں؟',
    cancel: 'منسوخ کریں',
    confirm: 'سب حذف کریں',
    settings: 'سیٹنگز',
    settingsGeneral: 'عمومی',
    settingsPersonalization: 'ذاتی ہدایات',
    aboutUserLabel: 'آپ چاہتے ہیں کہ NEXORA آپ کے بارے میں کیا جانے؟',
    aboutUserPlaceholder: 'مثال: میں ایک ویب ڈویلپر ہوں اور ری ایکٹ اور پائتھون پر کام کرتا ہوں...',
    customInstructionsLabel: 'آپ NEXORA سے کس انداز میں جواب چاہتے ہیں؟',
    customInstructionsHint: 'فعال ہونے پر تمام نئے پیغامات پر لاگو ہوگا۔',
    customInstructionsPlaceholder: 'مثال: جوابات مختصر اور واضح رکھیں، اور اردو میں آسان الفاظ استعمال کریں...',
    enableCustomInstructions: 'نئی چیٹس کے لیے فعال کریں',
    save: 'محفوظ کریں',
    saved: 'محفوظ ہو گیا',
    interfaceLanguage: 'زبان',
    themeLabel: 'تھیم',
    themeLight: 'روشن',
    themeDark: 'ڈارک',
    greetingMorning: 'میں آپ کی کیا مدد کر سکتا ہوں؟',
    greetingAfternoon: 'میں آپ کی کیا مدد کر سکتا ہوں؟',
    greetingEvening: 'میں آپ کی کیا مدد کر سکتا ہوں؟',
    welcomeSubtitle: 'اردو، ہندی یا انگریزی میں کچھ بھی پوچھیں — وائس چیٹ، PDF اور فائل تجزیہ، ویب سرچ اور کوڈ پریویو کے ساتھ۔',
    composerPlaceholder: 'کچھ بھی پوچھیں',
    attachFile: 'تصویر، PDF یا فائل شامل کریں',
    webSearch: 'تلاش',
    voiceInput: 'بول کر لکھیں',
    stopRecording: 'ریکارڈنگ روکیں',
    transcribing: 'تحریر ہو رہا ہے...',
    voiceChat: 'وائس چیٹ',
    voiceConnecting: 'وائس چیٹ جڑ رہی ہے...',
    voiceListening: 'سن رہا ہوں...',
    voiceSpeaking: 'NEXORA بول رہا ہے...',
    voiceProcessing: 'جواب تیار ہو رہا ہے...',
    voiceMuted: 'مائیکروفون بند ہے',
    voiceEnd: 'وائس چیٹ بند کریں',
    voiceMute: 'میوٹ',
    voiceUnmute: 'ان میوٹ',
    voiceFallbackHint: 'بولنے کے لیے مائیک دبائیں، بھیجنے کے لیے دوبارہ دبائیں۔',
    voiceHoldHint: 'اردو، ہندی یا انگریزی میں فطری انداز میں بات کریں۔',
    micError: 'مائیکروفون دستیاب نہیں ہے۔',
    send: 'پیغام بھیجیں',
    stop: 'روکیں',
    disclaimer: 'NEXORA سے غلطی ہو سکتی ہے۔ اہم معلومات کی تصدیق کریں۔',
    copy: 'کاپی',
    copied: 'کاپی ہو گیا',
    preview: 'پریویو',
    code: 'کوڈ',
    readAloud: 'سنیں',
    stopReading: 'روکیں',
    loadingAudio: 'آڈیو تیار ہو رہا ہے...',
    goodResponse: 'پسند آیا',
    badResponse: 'بہتر ہو سکتا ہے',
    regenerate: 'دوبارہ بنائیں',
    edit: 'ترمیم',
    saveAndSend: 'بھیجیں',
    retry: 'دوبارہ کوشش کریں',
    you: 'آپ',
    assistantName: 'NEXORA',
    thinking: 'سوچ رہا ہے...',
    sources: 'حوالہ جات',
    untitledChat: 'نئی چیٹ',
    shareChat: 'شیئر',
    shareTitle: 'گفتگو شیئر اور محفوظ کریں',
    shareDescription: 'اس گفتگو کا لنک شیئر کریں یا اپنے ڈیوائس پر محفوظ کریں۔',
    copyLink: 'شیئر لنک کاپی کریں',
    linkCopied: 'لنک کاپی ہو گیا',
    copyTranscript: 'مکمل متن کاپی کریں',
    shareNative: 'ڈیوائس سے شیئر کریں...',
    exportChat: 'ایکسپورٹ',
    exportMarkdown: 'مارک ڈاؤن (.md) ڈاؤن لوڈ',
    exportText: 'سادہ ٹیکسٹ (.txt) ڈاؤن لوڈ',
    exportedOn: 'تاریخِ برآمدگی',
    attachmentErrorSize: 'فائل کا سائز 10 MB سے کم ہونا چاہیے۔',
    attachmentErrorType: 'براہِ کرم تصویر، PDF یا ٹیکسٹ/کوڈ فائل منتخب کریں۔',
    starterPrompts: [
      {
        title: 'تخلیقی اور پیشہ ورانہ تحریر',
        description: 'اردو میں رسمی خط، ای میل یا مضمون تحریر کریں',
        prompt: 'کسی کمپنی کے کلائنٹ کو پروجیکٹ کی کامیاب تکمیل پر ایک شائستہ اور پیشہ ورانہ شکریہ کی ای میل اردو میں لکھیں۔',
      },
      {
        title: 'انٹرایکٹو کوڈ اور پریویو',
        description: 'لائیو پریویو کے ساتھ HTML/CSS/JS ٹولز بنائیں',
        prompt: 'ایک سادہ اور خوبصورت ڈیجیٹل گھڑی (Digital Clock) سنگل HTML کوڈ بلاک میں بنائیں جس کا لائیو پریویو دیکھا جا سکے۔',
      },
      {
        title: 'سہ لسانی ترجمہ',
        description: 'اردو، انگریزی اور ہندی کے درمیان فطری ترجمہ',
        prompt: 'اس جملے کا خوبصورت انگریزی اور ہندی میں ترجمہ کریں: "علم اور صبر کے ساتھ ہر مشکل مرحلہ آسان ہو جاتا ہے۔"',
      },
      {
        title: 'PDF اور فائل کا تجزیہ',
        description: 'PDF یا دستاویز منسلک کر کے خلاصہ اور سوالات پوچھیں',
        prompt: 'مصنوعی ذہانت (AI) کے جدید دور میں طلبہ کے لیے وقت کے بہتر انتظام کے 5 عملی اصول بیان کریں۔',
      },
    ],
  },
  hi: {
    dir: 'ltr',
    brandName: 'NEXORA',
    modelFast: 'NEXORA Fast',
    modelFastDesc: 'रोज़मर्रा के सवालों के लिए तुरंत उत्तर',
    modelThinking: 'NEXORA Thinking',
    modelThinkingDesc: 'जटिल तर्क और विश्लेषण के लिए गहन विचार',
    modelCode: 'NEXORA Code',
    modelCodeDesc: 'लाइव HTML/SVG प्रीव्यू के साथ कोडिंग असिस्टेंट',
    newChat: 'नई चैट',
    temporaryChat: 'अस्थायी चैट',
    temporaryChatBanner: 'अस्थायी चैट — यह इतिहास में सहेजी नहीं जाएगी',
    sharedChatBanner: 'आप एक साझा की गई बातचीत देख रहे हैं',
    continueChat: 'यह चैट जारी रखें',
    searchPlaceholder: 'चैट खोजें...',
    noChatsYet: 'आपकी बातचीत यहाँ दिखाई देगी।',
    noSearchResults: 'कोई मिलती-जुलती बातचीत नहीं मिली।',
    today: 'आज',
    yesterday: 'कल',
    previous7Days: 'पिछले 7 दिन',
    older: 'पुरानी',
    rename: 'नाम बदलें',
    delete: 'हटाएँ',
    clearAll: 'सभी चैट साफ़ करें',
    confirmClearAll: 'सभी बातचीत हटाएँ?',
    cancel: 'रद्द करें',
    confirm: 'सभी हटाएँ',
    settings: 'सेटिंग्स',
    settingsGeneral: 'सामान्य',
    settingsPersonalization: 'कस्टम निर्देश',
    aboutUserLabel: 'आप NEXORA को अपने बारे में क्या बताना चाहेंगे?',
    aboutUserPlaceholder: 'उदाहरण: मैं एक वेब डेवलपर हूँ और React तथा Python पर काम करता हूँ...',
    customInstructionsLabel: 'आप NEXORA से किस तरह के उत्तर चाहते हैं?',
    customInstructionsHint: 'सक्षम होने पर सभी नए संदेशों पर लागू होगा।',
    customInstructionsPlaceholder: 'उदाहरण: उत्तर संक्षिप्त रखें और उदाहरणों के साथ समझाएँ...',
    enableCustomInstructions: 'नई चैट के लिए सक्षम करें',
    save: 'सहेजें',
    saved: 'सहेजा गया',
    interfaceLanguage: 'भाषा',
    themeLabel: 'थीम',
    themeLight: 'लाइट',
    themeDark: 'डार्क',
    greetingMorning: 'मैं आपकी क्या मदद कर सकता हूँ?',
    greetingAfternoon: 'मैं आपकी क्या मदद कर सकता हूँ?',
    greetingEvening: 'मैं आपकी क्या मदद कर सकता हूँ?',
    welcomeSubtitle: 'हिन्दी, उर्दू या अंग्रेज़ी में कुछ भी पूछें — वॉइस चैट, PDF व फ़ाइल विश्लेषण, वेब खोज और कोड प्रीव्यू के साथ।',
    composerPlaceholder: 'कुछ भी पूछें',
    attachFile: 'फ़ोटो, PDF और फ़ाइलें जोड़ें',
    webSearch: 'खोजें',
    voiceInput: 'बोलकर लिखें',
    stopRecording: 'रिकॉर्डिंग रोकें',
    transcribing: 'लिख रहा है...',
    voiceChat: 'वॉइस चैट',
    voiceConnecting: 'वॉइस कनेक्ट हो रहा है...',
    voiceListening: 'सुन रहा हूँ...',
    voiceSpeaking: 'NEXORA बोल रहा है...',
    voiceProcessing: 'सोच रहा हूँ...',
    voiceMuted: 'माइक्रोफ़ोन म्यूट है',
    voiceEnd: 'वॉइस चैट समाप्त करें',
    voiceMute: 'म्यूट',
    voiceUnmute: 'अनम्यूट',
    voiceFallbackHint: 'बोलने के लिए माइक दबाएँ, भेजने के लिए दोबारा दबाएँ।',
    voiceHoldHint: 'हिन्दी, उर्दू या अंग्रेज़ी में सहजता से बात करें।',
    micError: 'माइक्रोफ़ोन उपलब्ध नहीं है।',
    send: 'संदेश भेजें',
    stop: 'रोकें',
    disclaimer: 'NEXORA से त्रुटियाँ हो सकती हैं। महत्वपूर्ण जानकारी की पुष्टि करें।',
    copy: 'कॉपी',
    copied: 'कॉपी हुआ',
    preview: 'प्रीव्यू',
    code: 'कोड',
    readAloud: 'सुनें',
    stopReading: 'रोकें',
    loadingAudio: 'ऑडियो लोड हो रहा है...',
    goodResponse: 'अच्छा उत्तर',
    badResponse: 'सुधार की आवश्यकता',
    regenerate: 'पुनः बनाएँ',
    edit: 'संपादित करें',
    saveAndSend: 'भेजें',
    retry: 'पुनः प्रयास करें',
    you: 'आप',
    assistantName: 'NEXORA',
    thinking: 'सोच रहा है...',
    sources: 'स्रोत',
    untitledChat: 'नई चैट',
    shareChat: 'शेयर',
    shareTitle: 'बातचीत शेयर और सहेजें',
    shareDescription: 'इस बातचीत का लिंक साझा करें या अपने डिवाइस पर सहेजें।',
    copyLink: 'शेयर लिंक कॉपी करें',
    linkCopied: 'लिंक कॉपी हुआ',
    copyTranscript: 'पूरा टेक्स्ट कॉपी करें',
    shareNative: 'डिवाइस से शेयर करें...',
    exportChat: 'एक्सपोर्ट',
    exportMarkdown: 'मार्कडाउन (.md) डाउनलोड',
    exportText: 'सादा टेक्स्ट (.txt) डाउनलोड',
    exportedOn: 'निर्यात तिथि',
    attachmentErrorSize: 'फ़ाइल का आकार 10 MB से अधिक नहीं होना चाहिए।',
    attachmentErrorType: 'कृपया छवि, PDF या टेक्स्ट/कोड फ़ाइल संलग्न करें।',
    starterPrompts: [
      {
        title: 'लेखन और संपादन',
        description: 'स्पष्ट और प्रभावशाली ईमेल या लेख तैयार करें',
        prompt: 'टीम के साथ नए प्रोजेक्ट की शुरुआत के लिए एक पेशेवर और प्रेरणादायक स्वागत ईमेल हिन्दी में लिखें।',
      },
      {
        title: 'इंटरैक्टिव कोड और प्रीव्यू',
        description: 'लाइव प्रीव्यू के साथ HTML/CSS/JS विजेट बनाएँ',
        prompt: 'एक आकर्षक इंटरैक्टिव स्टॉपवॉच (Stopwatch) कार्ड एक सिंगल HTML कोड ब्लॉक में बनाएँ ताकि मैं उसका लाइव प्रीव्यू देख सकूँ।',
      },
      {
        title: 'बहुभाषी अनुवाद',
        description: 'हिन्दी, उर्दू और अंग्रेज़ी के बीच सहज अनुवाद',
        prompt: 'इस वाक्य का स्वाभाविक अंग्रेज़ी और उर्दू में अनुवाद करें: "निरंतर अभ्यास और जिज्ञासा ही सफलता की सच्ची कुंजी हैं।"',
      },
      {
        title: 'PDF और फ़ाइल विश्लेषण',
        description: 'PDF या दस्तावेज़ संलग्न करके सारांश और प्रश्न पूछें',
        prompt: 'भारत में नवीकरणीय ऊर्जा (सौर और पवन ऊर्जा) के प्रमुख लाभ और चुनौतियाँ एक तालिका के रूप में प्रस्तुत करें।',
      },
    ],
  },
};

export function getTimeGreeting(lang: UILanguage): string {
  const hour = new Date().getHours();
  const t = TRANSLATIONS[lang];
  if (hour < 12) return t.greetingMorning;
  if (hour < 17) return t.greetingAfternoon;
  return t.greetingEvening;
}
