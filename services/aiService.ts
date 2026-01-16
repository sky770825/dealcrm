// 多模型 AI 服務 - 支援免費模型自動組合
import { Contact, Deal, IncomingLead } from "../types";

// 模型配置接口
interface ModelConfig {
  name: string;
  provider: 'openai' | 'huggingface' | 'groq' | 'together' | 'ollama' | 'cohere' | 'claude' | 'gemini';
  apiKey?: string;
  baseUrl?: string;
  model: string;
  priority: number; // 優先級，數字越小優先級越高（1-3 為免費模型）
  enabled: boolean;
}

// 預設模型配置（免費或低成本，無需 API Key）
const DEFAULT_MODELS: ModelConfig[] = [
  // === 無需 API Key 的免費模型（優先使用） ===
  {
    name: 'Hugging Face (Mixtral 8x7B)',
    provider: 'huggingface',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    priority: 1,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  {
    name: 'Hugging Face (Llama 3.2)',
    provider: 'huggingface',
    model: 'meta-llama/Llama-3.2-3B-Instruct',
    priority: 1,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  {
    name: 'Hugging Face (Qwen 2.5)',
    provider: 'huggingface',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    priority: 1,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  {
    name: 'Hugging Face (Gemma 2B)',
    provider: 'huggingface',
    model: 'google/gemma-2b-it',
    priority: 2,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  {
    name: 'Hugging Face (Phi-3)',
    provider: 'huggingface',
    model: 'microsoft/Phi-3-mini-4k-instruct',
    priority: 2,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  {
    name: 'Hugging Face (Llama 2 7B)',
    provider: 'huggingface',
    model: 'meta-llama/Llama-2-7b-chat-hf',
    priority: 2,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  {
    name: 'Hugging Face (Falcon)',
    provider: 'huggingface',
    model: 'tiiuae/falcon-7b-instruct',
    priority: 3,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  {
    name: 'Hugging Face (Zephyr)',
    provider: 'huggingface',
    model: 'HuggingFaceH4/zephyr-7b-beta',
    priority: 3,
    enabled: true,
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  // === 需要 API Key 的模型（備選） ===
  {
    name: 'Groq (Llama 3.1)',
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    priority: 10,
    enabled: false, // 需要 API Key
    baseUrl: 'https://api.groq.com/openai/v1'
  },
  {
    name: 'Together AI (Llama 2)',
    provider: 'together',
    model: 'meta-llama/Llama-2-70b-chat-hf',
    priority: 11,
    enabled: false, // 需要 API Key
    baseUrl: 'https://api.together.xyz/v1'
  },
  {
    name: 'Ollama (Local)',
    provider: 'ollama',
    model: 'llama2',
    priority: 12,
    enabled: false, // 需要本地安裝
    baseUrl: 'http://localhost:11434'
  }
];

// 從環境變數或加密存儲讀取 API Keys
export const getApiKeys = async (): Promise<Record<string, string>> => {
  try {
    const { loadEncryptedApiKeys } = await import('../utils/encryptedStorage');
    const result = await loadEncryptedApiKeys();
    if (result.success && result.data) {
      return result.data;
    }
    // 降級到未加密存儲（向後兼容）
    const stored = localStorage.getItem('ai_api_keys');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return {};
      }
    }
    return {};
  } catch (error) {
    console.error('讀取 API Keys 失敗:', error);
    return {};
  }
};

// 儲存 API Keys（加密）
export const saveApiKeys = async (keys: Record<string, string>): Promise<void> => {
  try {
    const { saveEncryptedApiKeys } = await import('../utils/encryptedStorage');
    await saveEncryptedApiKeys(keys);
  } catch (error) {
    console.error('保存 API Keys 失敗:', error);
    // 降級到未加密存儲
    localStorage.setItem('ai_api_keys', JSON.stringify(keys));
  }
};

// 獲取可用的模型列表（異步）
export const getAvailableModels = async (): Promise<ModelConfig[]> => {
  const apiKeys = await getApiKeys();
  return DEFAULT_MODELS.map(model => ({
    ...model,
    apiKey: apiKeys[model.provider] || model.apiKey,
    enabled: model.enabled && (
      model.provider === 'huggingface' || // Hugging Face 不需要 API Key（有速率限制，但免費）
      (!!apiKeys[model.provider] && (model.provider === 'groq' || model.provider === 'together')) || 
      (model.provider === 'ollama' && model.enabled) // Ollama 需要本地安裝
    )
  })).filter(m => m.enabled).sort((a, b) => a.priority - b.priority);
};

// 設定 API Key（異步，加密存儲）
export const setApiKey = async (provider: string, apiKey: string): Promise<void> => {
  const keys = await getApiKeys();
  keys[provider] = apiKey;
  await saveApiKeys(keys);
};

// AI 請求結果
interface AIResponse {
  text: string;
  model: string;
  provider: string;
  success: boolean;
  error?: string;
}

// 通用 AI 請求函數（導出供外部使用）
export const callAI = async (
  prompt: string,
  systemPrompt?: string,
  modelConfig?: ModelConfig
): Promise<AIResponse> => {
  const modelsList = modelConfig ? [modelConfig] : await getAvailableModels();
  
  if (modelsList.length === 0) {
    return {
      text: '',
      model: 'none',
      provider: 'none',
      success: false,
      error: '沒有可用的 AI 模型。請在設定中配置 API Keys。'
    };
  }

  // 嘗試每個模型，直到成功（最多嘗試 3 個模型）
  const maxAttempts = Math.min(3, modelsList.length);
  const attemptedModels: string[] = [];
  
  for (let i = 0; i < maxAttempts; i++) {
    const model = modelsList[i];
    if (!model) continue;
    
    try {
      let response: AIResponse;
      
      switch (model.provider) {
        case 'groq':
          response = await callGroq(prompt, systemPrompt, model);
          break;
        case 'huggingface':
          response = await callHuggingFace(prompt, systemPrompt, model);
          break;
        case 'together':
          response = await callTogether(prompt, systemPrompt, model);
          break;
        case 'ollama':
          response = await callOllama(prompt, systemPrompt, model);
          break;
        default:
          continue;
      }
      
      if (response.success && response.text.trim()) {
        return response;
      }
    } catch (error: any) {
      attemptedModels.push(`${model.name} (${error.message || '未知錯誤'})`);
      console.warn(`模型 ${model.name} 失敗:`, error);
      // 繼續嘗試下一個模型
      continue;
    }
  }
  
  // 如果所有模型都失敗，返回錯誤信息
  return {
    text: '',
    model: 'none',
    provider: 'multi',
    success: false,
    error: attemptedModels.length > 0 
      ? `所有模型都無法使用。已嘗試：${attemptedModels.join(', ')}`
      : '所有 AI 模型都無法使用。請檢查網路連線或 API Keys。'
  };
};

// Groq API 調用
const callGroq = async (
  prompt: string,
  systemPrompt?: string,
  config?: ModelConfig
): Promise<AIResponse> => {
  const apiKey = config?.apiKey;
  if (!apiKey) {
    throw new Error('Groq API Key 未設定，請在 AI 模型設定中配置');
  }
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`Groq API 錯誤: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    model: config.model,
    provider: 'groq',
    success: true
  };
};

// Hugging Face API 調用（支援多種模型格式）
const callHuggingFace = async (
  prompt: string,
  systemPrompt?: string,
  config?: ModelConfig
): Promise<AIResponse> => {
  const modelName = config?.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
  
  // 構建提示詞（根據模型類型調整格式）
  let fullPrompt = prompt;
  if (systemPrompt) {
    // 對於支援 system prompt 的模型（如 Llama 3.2, Qwen）
    if (modelName.includes('Llama-3') || modelName.includes('Qwen') || modelName.includes('zephyr')) {
      fullPrompt = `<|system|>\n${systemPrompt}<|end|>\n<|user|>\n${prompt}<|end|>\n<|assistant|>\n`;
    } else if (modelName.includes('gemma')) {
      fullPrompt = `<start_of_turn>user\n${systemPrompt}\n\n${prompt}<end_of_turn>\n<start_of_turn>model\n`;
    } else if (modelName.includes('Phi-3')) {
      fullPrompt = `<|system|>\n${systemPrompt}<|end|>\n<|user|>\n${prompt}<|end|>\n<|assistant|>\n`;
    } else {
      // 其他模型使用簡單格式
      fullPrompt = `${systemPrompt}\n\n用戶問題：${prompt}`;
    }
  }
  
  const url = `https://api-inference.huggingface.co/models/${modelName}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (config?.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  // 嘗試調用 API
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          return_full_text: false,
          top_p: 0.9
        }
      })
    });
  } catch (error: any) {
    throw new Error(`網路錯誤: ${error.message}`);
  }
  
  if (!response.ok) {
    // 如果是 503，模型可能正在載入，等待後重試
    if (response.status === 503) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? Math.min(parseInt(retryAfter) * 1000, 30000) : 15000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // 重試一次
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 1000,
              temperature: 0.7,
              return_full_text: false
            }
          })
        });
      } catch (retryError: any) {
        throw new Error(`重試失敗: ${retryError.message}`);
      }
      
      if (!response.ok) {
        throw new Error(`Hugging Face API 錯誤 (${response.status}): ${response.statusText}`);
      }
    } else {
      throw new Error(`Hugging Face API 錯誤 (${response.status}): ${response.statusText}`);
    }
  }
  
  const data = await response.json();
  let text = '';
  
  // 處理不同格式的回應
  if (Array.isArray(data)) {
    if (data[0]?.generated_text) {
      text = data[0].generated_text;
    } else if (data[0]?.text) {
      text = data[0].text;
    }
  } else if (data.generated_text) {
    text = data.generated_text;
  } else if (data.text) {
    text = data.text;
  } else if (typeof data === 'string') {
    text = data;
  }
  
  // 清理回應文本（移除提示詞部分和特殊標記）
  if (text) {
    text = text.replace(fullPrompt, '').trim();
    // 移除常見的結束標記
    text = text.replace(/<\|end\|>/g, '').replace(/<end_of_turn>/g, '').trim();
  }
  
  return {
    text: text || '',
    model: modelName,
    provider: 'huggingface',
    success: !!text
  };
};

// Together AI API 調用
const callTogether = async (
  prompt: string,
  systemPrompt?: string,
  config?: ModelConfig
): Promise<AIResponse> => {
  if (!config?.apiKey) {
    throw new Error('Together AI API Key 未設定');
  }
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`Together AI API 錯誤: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    model: config.model,
    provider: 'together',
    success: true
  };
};

// Ollama API 調用（本地模型）
const callOllama = async (
  prompt: string,
  systemPrompt?: string,
  config?: ModelConfig
): Promise<AIResponse> => {
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n用戶問題：${prompt}`
    : prompt;
  
  const response = await fetch(`${config?.baseUrl || 'http://localhost:11434'}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config?.model || 'llama2',
      prompt: fullPrompt,
      stream: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ollama API 錯誤: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    text: data.response || '',
    model: config?.model || 'llama2',
    provider: 'ollama',
    success: true
  };
};

// 組合多個模型的回應（取最佳結果或合併）
const combineModels = async (
  prompt: string,
  systemPrompt?: string,
  count: number = 2
): Promise<AIResponse> => {
  const allModels = await getAvailableModels();
  const models = allModels.slice(0, count);
  const results: AIResponse[] = [];
  
  // 並行調用多個模型
  const promises = models.map(model => callAI(prompt, systemPrompt, model));
  const responses = await Promise.allSettled(promises);
  
  for (const result of responses) {
    if (result.status === 'fulfilled' && result.value.success) {
      results.push(result.value);
    }
  }
  
  if (results.length === 0) {
    return {
      text: '',
      model: 'combined',
      provider: 'multi',
      success: false,
      error: '所有模型都無法使用'
    };
  }
  
  // 選擇最長的回應（通常質量較好）
  const bestResult = results.reduce((best, current) => 
    current.text.length > best.text.length ? current : best
  );
  
  return {
    ...bestResult,
    model: `combined(${results.map(r => r.model).join(',')})`,
    provider: 'multi'
  };
};

// ========== 業務功能實現 ==========

export const cleanAIOutput = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[#*~_>]/g, "") 
    .replace(/\n{3,}/g, "\n\n") 
    .trim();
};

// 解析潛在客戶資料
export const parseRawLead = async (text: string): Promise<IncomingLead | null> => {
  const systemPrompt = `你是一個專業的房地產 CRM 系統助手。請從以下對話內容中提取客戶資訊，並以 JSON 格式返回：
{
  "name": "客戶姓名",
  "phone": "電話號碼",
  "budget": 預算數字（單位：萬）,
  "preferredArea": "目標區域（如：台北市大安區）",
  "requirement": "需求描述",
  "source": "來源（如：LINE、電話、網站等）"
}

如果某個欄位無法從對話中提取，請使用 null。只返回 JSON，不要其他文字。`;
  
  const response = await callAI(text, systemPrompt);
  if (!response.success) return null;
  
  try {
    // 嘗試從回應中提取 JSON
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: `lead-${Date.now()}`,
        name: parsed.name || '未知',
        phone: parsed.phone || '',
        budget: parsed.budget || 0,
        preferredArea: parsed.preferredArea || '',
        source: parsed.source || '未知',
        rawContent: text,
        receivedAt: new Date().toISOString(),
        status: 'pending' as const,
        role: parsed.role || 'buyer' as 'buyer' | 'seller'
      };
    }
  } catch (e) {
    console.error('解析 JSON 失敗:', e);
  }
  
  return null;
};

// 獲取成交攻略
export const getClosingTactics = async (contact: Contact): Promise<{
  persona: string;
  resistance: string;
  tactics: string;
}> => {
  const systemPrompt = `你是一個專業的房地產銷售顧問。請根據客戶資料分析客戶性格、抗拒點，並提供成交戰術。`;
  
  const prompt = `客戶資料：
姓名：${contact.name}
角色：${contact.role === 'buyer' ? '買方' : '賣方'}
預算：${contact.budget} 萬
目標區域：${contact.preferredArea}
需求：${contact.requirement || '無'}
狀態：${contact.status}

請提供：
1. 性格畫像（簡短描述客戶性格特質）
2. 核心抗拒點（客戶可能的疑慮或阻礙）
3. 建議攻防戰術（具體的銷售策略和話術）`;
  
  const response = await callAI(prompt, systemPrompt);
  
  if (!response.success) {
    return {
      persona: '分析中...',
      resistance: '分析中...',
      tactics: 'AI 分析功能暫時無法使用，請稍後再試。'
    };
  }
  
  const text = response.text;
  const lines = text.split('\n').filter(l => l.trim());
  
  return {
    persona: lines.find(l => l.includes('性格') || l.includes('特質'))?.replace(/^[^：:]*[：:]/, '').trim() || '需要進一步了解',
    resistance: lines.find(l => l.includes('抗拒') || l.includes('疑慮'))?.replace(/^[^：:]*[：:]/, '').trim() || '需要進一步溝通',
    tactics: text.split('戰術')[1] || text.split('策略')[1] || text || '建議持續跟進，建立信任關係。'
  };
};

// 計算配案分數
export const calculateMatchScore = async (
  buyer: Contact,
  seller: Contact
): Promise<{
  score: number;
  reason: string;
  breakdown: { location: number; value: number; layout: number };
}> => {
  const systemPrompt = `你是一個專業的房地產配案系統。請評估買方和賣方的匹配度，給出 0-100 的分數。`;
  
  const prompt = `買方需求：
預算：${buyer.budget} 萬
區域：${buyer.preferredArea}
房數：${buyer.rooms || '不限'}
車位：${buyer.hasParking || '不限'}
樓層偏好：${buyer.floorPref || '不限'}

賣方物件：
開價：${seller.budget} 萬
區域：${seller.preferredArea}
房數：${seller.rooms || '未知'}
車位：${seller.hasParking || '未知'}

請評估匹配度（0-100），並說明原因。`;
  
  const response = await callAI(prompt, systemPrompt);
  
  if (!response.success) {
    // 降級到簡單規則匹配
    const budgetMatch = seller.budget <= buyer.budget * 1.2 && seller.budget >= buyer.budget * 0.8;
    const areaMatch = buyer.preferredArea && seller.preferredArea && 
      (buyer.preferredArea.includes(seller.preferredArea.substring(0, 2)) || 
       seller.preferredArea.includes(buyer.preferredArea.substring(0, 2)));
    
    return {
      score: (budgetMatch ? 40 : 20) + (areaMatch ? 40 : 20),
      reason: budgetMatch && areaMatch ? '預算和區域都符合' : '部分條件符合',
      breakdown: {
        location: areaMatch ? 80 : 40,
        value: budgetMatch ? 80 : 40,
        layout: 50
      }
    };
  }
  
  // 嘗試從 AI 回應中提取分數
  const scoreMatch = response.text.match(/(\d+)\s*分|分數[：:]\s*(\d+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 70;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    reason: response.text.substring(0, 200),
    breakdown: {
      location: Math.min(100, score + 10),
      value: Math.min(100, score),
      layout: Math.min(100, score - 10)
    }
  };
};

// 生成全球摘要
export const getGlobalSummary = async (contacts: Contact[], deals: Deal[]): Promise<string> => {
  const systemPrompt = `你是一個專業的房地產業務分析師。請根據客戶和交易資料提供業務洞察和建議。`;
  
  const prompt = `客戶統計：
總客戶數：${contacts.length}
買方：${contacts.filter(c => c.role === 'buyer').length} 位
賣方：${contacts.filter(c => c.role === 'seller').length} 位

交易統計：
總交易數：${deals.length}
進行中：${deals.filter(d => d.stage !== '結案').length} 筆
已結案：${deals.filter(d => d.stage === '結案').length} 筆

請提供業務分析和建議。`;
  
  const response = await callAI(prompt, systemPrompt);
  return response.success ? response.text : '無法生成分析，請稍後再試。';
};

// 生成策略語音腳本
export const generateStrategySpeech = async (summary: string): Promise<string> => {
  const systemPrompt = `你是一個專業的業務簡報撰寫者。請將業務分析轉換為適合語音朗讀的簡報稿。`;
  
  const prompt = `請將以下分析轉換為語音簡報稿（適合朗讀，語調自然）：\n\n${summary}`;
  
  const response = await callAI(prompt, systemPrompt);
  return response.success ? response.text : summary;
};

// 生成開發文案
export const generateOutreachMessage = async (
  scenario: string,
  target: string
): Promise<string> => {
  const systemPrompt = `你是一個專業的房地產開發業務。請撰寫專業、親切且有效的開發訊息。`;
  
  const prompt = `情境：${scenario}
目標對象：${target}

請撰寫一段開發訊息（約 100-150 字），要親切、專業且能引起興趣。`;
  
  const response = await callAI(prompt, systemPrompt);
  return response.success ? response.text : '請手動撰寫開發訊息。';
};

// 物件比對
export const compareProperties = async (p1: string, p2: string): Promise<{
  text: string;
  sources: any[];
}> => {
  const systemPrompt = `你是一個專業的房地產分析師。請比較兩個物件的優劣勢。`;
  
  const prompt = `物件 A：\n${p1}\n\n物件 B：\n${p2}\n\n請詳細比較兩個物件的優劣勢，並給出建議。`;
  
  const response = await callAI(prompt, systemPrompt);
  return {
    text: response.success ? response.text : '無法進行比對分析。',
    sources: []
  };
};

// 圖片分析（需要 vision 模型，這裡提供基礎實現）
export const analyzeInteriorImage = async (imageBase64: string): Promise<string> => {
  // 注意：免費模型通常不支援圖片分析，這裡返回提示
  return '圖片分析功能需要支援 Vision 的模型（如 GPT-4 Vision）。免費模型暫不支援此功能。';
};

// 其他功能保持與原 geminiService 相同的接口
export const generateStagedImage = async (originalFile: any, style: string): Promise<string | null> => {
  return null; // 圖片生成需要專門的模型
};

export const generateMarketingImage = async (prompt: string, aspectRatio: "16:9" | "9:16" | "1:1"): Promise<string | null> => {
  return null;
};

export const generateMarketingPromptFromImage = async (file: any): Promise<string> => {
  return '';
};

export const generateAIPrompt = async (type: 'image' | 'video', style: string, analysis: string): Promise<string> => {
  return '';
};

export const getLatestRealEstateNews = async (): Promise<{ text: string; sources: any[] }> => {
  return { text: '', sources: [] };
};

export const analyzeVideoSceneImage = async (file: any): Promise<string> => {
  return '';
};

export const generateVideoScript = async (
  propertyInfo: string,
  files: any[],
  style: string,
  protagonistName: string,
  endingTagline: string
): Promise<string> => {
  return '';
};

export const analyzePropertyFiles = async (files: any[]): Promise<string> => {
  return '';
};
