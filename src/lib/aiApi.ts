export type AIProvider = 'openai' | 'replicate';

export type GPT5Model = 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano' | 'gpt-4o-mini' | 'gpt-4.1-nano' | 'meta/meta-llama-3-8b-instruct';

export type ImageModel = 'seedream-4' | 'nano-banana' | 'flux-kontext-pro';

export interface AIResponse {
  success: boolean;
  data?: {
    commands: CanvasCommand[];
    message: string;
  };
  error?: string;
  debug?: {
    tokens_used?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    model?: string;
    response_time_ms?: number;
    function_calls?: number;
    provider?: string;
    raw_response_length?: number;
  };
}

export interface ImageGenerationResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    prompt: string;
  };
  error?: string;
  debug?: {
    provider?: string;
    model?: string;
    response_time_ms?: number;
    output_type?: string;
  };
}

export interface CanvasCommand {
  action: 'create' | 'edit';
  type?: 'rectangle' | 'circle' | 'text';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  shapeId?: string;
  rotation?: number;
}

interface AITestRequest {
  prompt: string;
  provider?: AIProvider;
  model?: GPT5Model;
  selectedContent?: any;
}

/**
 * Calls the AI test Firebase function with a user prompt
 * @param prompt - The user's prompt to send to the AI
 * @param provider - The AI provider to use ('openai' or 'replicate')
 * @param model - The GPT-5 model to use ('gpt-5', 'gpt-5-mini', or 'gpt-5-nano')
 * @param selectedContent - Optional selected content object for editing
 * @returns Promise<AIResponse> - The AI's response or error
 */
export const callAITest = async (
  prompt: string,
  provider: AIProvider = 'openai',
  model: GPT5Model = 'gpt-5-mini',
  selectedContent?: any
): Promise<AIResponse> => {
  try {
    // Determine function URL based on provider and environment
    const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost';

    const functionUrl = provider === 'replicate'
      ? (isLocal
          ? 'http://localhost:5001/collab-canvas-kenkel/us-central1/ai_text_to_canvas_replicate'
          : 'https://us-central1-collab-canvas-kenkel.cloudfunctions.net/ai_text_to_canvas_replicate')
      : (isLocal
          ? 'http://localhost:5001/collab-canvas-kenkel/us-central1/ai_text_to_canvas'
          : 'https://us-central1-collab-canvas-kenkel.cloudfunctions.net/ai_text_to_canvas');

    console.log(`[AI API] Calling ${provider} with model: ${model}`, selectedContent ? 'with selected content' : '');

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, provider, model, selectedContent } as AITestRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI API] HTTP error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('[AI API] Response received:', {
      success: data.success,
      commandCount: data.data?.commands?.length || 0,
      hasError: !!data.error,
      debug: data.debug
    });
    console.log('[AI API] Commands:', data.data?.commands);
    return data;
  } catch (error) {
    console.error('[AI API] Error:', error);
    throw error;
  }
};

/**
 * Calls the AI test Firebase function with a user prompt (alternative endpoint)
 * This version calls the Firebase function directly
 * @param prompt - The user's prompt to send to the AI
 * @returns Promise<AIResponse> - The AI's response or error
 */
export const callAITestDirect = async (prompt: string): Promise<AIResponse> => {
  try {
    // This would be the direct Firebase function URL
    // You'll need to replace this with your actual Firebase function URL
    const functionUrl = 'https://us-central1-collabcanvas.cloudfunctions.net/ai_test';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt } as AITestRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling AI test function directly:', error);
    throw error;
  }
};

/**
 * Generates an image using Replicate image generation models
 * @param prompt - The user's prompt describing the image to generate
 * @param model - The image generation model to use
 * @returns Promise<ImageGenerationResponse> - The generated image URL or error
 */
export const generateImage = async (
  prompt: string,
  model: ImageModel = 'seedream-4'
): Promise<ImageGenerationResponse> => {
  try {
    // Determine function URL based on environment
    const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost';

    const functionUrl = isLocal
      ? 'http://localhost:5001/collab-canvas-kenkel/us-central1/ai_generate_image'
      : 'https://us-central1-collab-canvas-kenkel.cloudfunctions.net/ai_generate_image';

    console.log(`[Image Generation API] Generating image with model: ${model}, prompt: ${prompt.substring(0, 50)}...`);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Image Generation API] HTTP error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Image Generation API] Response received:', {
      success: data.success,
      hasImageUrl: !!data.data?.imageUrl,
      hasError: !!data.error,
      debug: data.debug
    });

    return data;
  } catch (error) {
    console.error('[Image Generation API] Error:', error);
    throw error;
  }
};
