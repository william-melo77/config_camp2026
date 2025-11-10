import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

export interface ChatLLMConfig {
  model: string;
  useResponsesApi?: boolean;
  temperature?: number | null;
  top_p?: number | null;
  file_search?: boolean;
  vector_store_ids?: string[]; // IDs del vector store de OpenAI (no UUID internos)
}

export interface ChatPromptConfig {
  system_prompt?: string | null;
  user_instructions?: string | null;
}

export interface InvokeParams {
  input: string;
  chat_history: BaseMessage[];
}

export interface ChatResult {
  content: string;
  raw?: any;
}

export class OpenAIChatProvider {
  private llm: ChatOpenAI;
  private prompt: ChatPromptTemplate;
  private runnable: any;

  constructor(llmConfig: ChatLLMConfig, promptConfig: ChatPromptConfig) {
    const { model, useResponsesApi = true, temperature, top_p, file_search, vector_store_ids } = llmConfig;

    this.llm = new ChatOpenAI({ model, useResponsesApi, temperature: temperature ?? undefined, topP: top_p ?? undefined });

    // Bind tools si file_search habilitado
    if (file_search && vector_store_ids && vector_store_ids.length > 0) {
      this.runnable = (this.llm as any).bindTools([
        { type: "file_search", vector_store_ids: vector_store_ids },
      ] as any);
    } else {
      this.runnable = this.llm;
    }

    const system = promptConfig.system_prompt || "Eres el asistente de Cívok. Responde en español, conciso y accionable.";
    const instructions = promptConfig.user_instructions || "";

    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", system],
      ["system", instructions ? `Instrucciones del usuario (si no entran en conflicto): {user_instructions}` : ""],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);
  }

  public async invoke(params: InvokeParams & { user_instructions?: string | null }): Promise<ChatResult> {
    const chain = this.prompt.pipe(this.runnable);
    const res = await chain.invoke({
      user_instructions: params.user_instructions ?? "",
      input: params.input,
      chat_history: params.chat_history,
    });
    const content = Array.isArray((res as any).content)
      ? (res as any).content.map((c: any) => (typeof c === "string" ? c : c?.text ?? "")).join("\n")
      : (res as any).content;
    return { content, raw: res };
  }

  public async *stream(params: InvokeParams & { user_instructions?: string | null }): AsyncGenerator<string, ChatResult> {
    const chain = this.prompt.pipe(this.runnable);
    const streamIt = await chain.stream({
      user_instructions: params.user_instructions ?? "",
      input: params.input,
      chat_history: params.chat_history,
    } as any);
    let full = "";
    for await (const chunk of streamIt as any) {
      const text = Array.isArray(chunk?.content)
        ? chunk.content.map((c: any) => (typeof c === "string" ? c : c?.text ?? "")).join("")
        : chunk?.content ?? "";
      if (text) {
        full += text;
        yield text;
      }
    }
    return { content: full };
  }
}

// Helper para mapear roles del historial (por si se desea usar aquí)
export const mapDbMessagesToLangChain = (items: Array<{ role: string; content: string | null }>): BaseMessage[] => {
  const msgs: BaseMessage[] = [];
  for (const it of items) {
    if (it.role === "user") msgs.push(new HumanMessage(it.content || ""));
    else if (it.role === "assistant") msgs.push(new AIMessage(it.content || ""));
    else if (it.role === "system") msgs.push(new SystemMessage(it.content || ""));
    // tool: se ignora en esta versión
  }
  return msgs;
};