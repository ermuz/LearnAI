import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createChatModel } from "@ermuz/node-shared";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  RunnableBranch,
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  MessageContent,
  ToolMessage,
} from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import chalk from "chalk";

/** 单轮 agent 在 Runnable 之间传递的状态（含可选的中间字段） */
type AgentState = {
  messages: BaseMessage[];
  done: boolean;
  final: MessageContent | null;
  tools: DynamicStructuredTool[];
  response?: AIMessage;
  toolMessages?: ToolMessage[];
};

/** `RunnablePassthrough.assign({ response: llmChain })` 之后，`response` 已由模型产出 */
type AgentStateAfterLlm = Omit<AgentState, "response"> & {
  response: AIMessage;
};

const model = createChatModel();
const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "baidu-maps-StreamableHTTP": {
      url: "https://mcp.map.baidu.com/mcp?ak=jwtX0nuPb7ttnIPE48ZxjKPa99oY4Lvs",
    },
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    },
  },
});

const mcpTools = await mcpClient.getTools();

const modelWithTools = model.bindTools(mcpTools);

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个可以调用 MCP 工具的智能助手。"],
  new MessagesPlaceholder("messages"),
]);

const llmChain = prompt.pipe(modelWithTools);

const toolExecutor = RunnableLambda.from<AgentStateAfterLlm, ToolMessage[]>(
  async (input) => {
    const { response, tools } = input;
    const toolResults: ToolMessage[] = [];
    if (!response.tool_calls?.length) return toolResults;

    for (const toolCall of response.tool_calls) {
      const findTool = tools.find((tool) => tool.name === toolCall.name);
      if (!findTool) continue;
      const toolResult = await findTool.invoke(toolCall.args);
      // 兼容不同返回格式的字符串化
      const contentStr =
        typeof toolResult === "string"
          ? toolResult
          : toolResult?.text || JSON.stringify(toolResult);
      toolResults.push(
        new ToolMessage({
          content: contentStr,
          tool_call_id: toolCall.id!,
        }),
      );
    }
    return toolResults;
  },
);

const agentStepChain = RunnableSequence.from<AgentState, AgentState>([
  RunnablePassthrough.assign({
    response: llmChain,
  }),
  RunnableBranch.from<AgentStateAfterLlm, AgentState>([
    [
      (state: AgentStateAfterLlm) => !state.response.tool_calls?.length,
      RunnableLambda.from<AgentStateAfterLlm, AgentState>(async (state) => {
        const { response, messages } = state;
        return {
          ...state,
          messages: [...messages, response],
          done: true,
          final: response.content ?? null,
        };
      }),
    ],
    RunnableSequence.from<AgentStateAfterLlm, AgentState>([
      // 日志打印工具调用
      RunnableLambda.from<AgentStateAfterLlm, AgentStateAfterLlm>(
        async (state) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];
          const calls = response.tool_calls ?? [];

          console.log(chalk.bgBlue(`🔍 检测到${calls.length}个工具调用`));
          console.log(
            chalk.bgBlue(`🔍 工具调用:${calls.map((t) => t.name).join(", ")}`),
          );

          return {
            ...state,
            messages: newMessages,
          };
        },
      ),
      // 调用工具执行器，得到 toolMessages
      RunnablePassthrough.assign({
        toolMessages: toolExecutor,
      }),
      // 将 toolMessages 添加到 messages 中，继续下一轮循环
      RunnableLambda.from<AgentState, AgentState>(async (state) => {
        const { messages, toolMessages } = state;
        return {
          ...state,
          messages: [...messages, ...(toolMessages ?? [])],
          done: false,
        };
      }),
    ]),
  ]),
]);

async function runAgentWithTools(query: string, maxIterations = 30) {
  let state: AgentState = {
    messages: [new HumanMessage(query)],
    done: false,
    final: null,
    tools: mcpTools,
  };

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`)); // 每一轮都通过一个完整的 Runnable chain（LLM + 工具调用处理）

    state = await agentStepChain.invoke(state);

    if (state.done) {
      console.log(`\n✨ AI 最终回复:\n${state.final}\n`);
      return state.final;
    }
  }

  return state.messages[state.messages.length - 1].content;
}

await runAgentWithTools(
  "北京南站附近的酒店，最近的 3 个酒店，拿到酒店图片，打开浏览器，展示每个酒店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为酒店名",
);
