
// AI 功能已停用 - 僅保留類型定義
// import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Contact, Deal, IncomingLead } from "../types";

export interface PropertyFile {
  data: string; // base64
  mimeType: string;
  name: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const cleanAIOutput = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[#*~_>]/g, "") 
    .replace(/\n{3,}/g, "\n\n") 
    .trim();
};

/**
 * 強化一致性的虛擬裝修：嚴格鎖定建築結構
 */
export const generateStagedImage = async (originalFile: PropertyFile, style: string): Promise<string | null> => {
  // AI 功能已停用
  return null;
};

export const generateMarketingImage = async (prompt: string, aspectRatio: "16:9" | "9:16" | "1:1" = "16:9"): Promise<string | null> => {
  // AI 功能已停用
  return null;
};

export const generateMarketingPromptFromImage = async (file: PropertyFile): Promise<string> => {
  // AI 功能已停用
  return "";
};

export const generateAIPrompt = async (type: 'image' | 'video', style: string, analysis: string): Promise<string> => {
  // AI 功能已停用
  return "";
};

export const compareProperties = async (p1: string, p2: string) => {
  // AI 功能已停用
  return { text: "", sources: [] };
};

export const generateOutreachMessage = async (scenario: string, target: string) => {
  // AI 功能已停用
  return "";
};

export const getLatestRealEstateNews = async () => {
  // AI 功能已停用
  return { text: "", sources: [] };
};

export const analyzeInteriorImage = async (file: PropertyFile) => {
  // AI 功能已停用
  return "";
};

export const analyzeVideoSceneImage = async (file: PropertyFile) => {
  // AI 功能已停用
  return "";
};

/**
 * 加強版影音腳本生成
 */
export const generateVideoScript = async (propertyInfo: string, files: PropertyFile[], style: string, protagonistName: string, endingTagline: string) => {
  // AI 功能已停用
  return "";
};

export const parseRawLead = async (t: string) => {
  // AI 功能已停用
  return null;
};

export const getGlobalSummary = async (c: any, d: any) => {
  // AI 功能已停用
  return "";
};

export const generateStrategySpeech = async (t: string) => {
  // AI 功能已停用
  return "";
};

export const getClosingTactics = async (c: Contact) => {
  // AI 功能已停用
  return { persona: "", resistance: "", tactics: "" };
};

/**
 * 智慧配案核心算法
 */
export const calculateMatchScore = async (buyer: Contact, seller: Contact) => {
  // AI 功能已停用，返回預設值
  return { score: 50, reason: "AI 分析功能已停用", breakdown: { location: 50, value: 50, layout: 50 } };
};

export const analyzePropertyFiles = async (files: PropertyFile[]) => {
  // AI 功能已停用
  return "";
};
