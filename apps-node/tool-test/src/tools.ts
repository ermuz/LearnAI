import { tool } from "@langchain/core/tools";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import z from "zod";
import { spawn } from "child_process";

export const readFileTool = tool(
  async ({ filePath }) => {
    const content = await readFile(filePath, "utf-8");
    console.log(
      `[工具调用][readFile] 文件路径：${filePath}, 成功读取 ${content.length} 字节`,
    );
    return `[文件内容]：\n${content}`;
  },
  {
    name: "readFile",
    description: "读取文件内容",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
    }),
  },
);

export const writeFileTool = tool(
  async ({ filePath, content }) => {
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, content);
    console.log(
      `  [工具调用] [writeFile] ("${filePath}") - 成功写入 ${content.length} 字节`,
    );
    return `成功写入文件：${filePath}`;
  },
  {
    name: "writeFile",
    description: "写入内容到文件",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
      content: z.string().describe("要写入文件的内容"),
    }),
  },
);

export const listDirectoryTool = tool(
  async ({ dirPath }) => {
    const files = await readdir(dirPath);
    console.log(
      `  [工具调用] [listDirectory] ("${dirPath}") - 成功列出 ${files.length} 个文件/目录`,
    );
    return `目录 "${dirPath}" 包含以下文件/目录：\n${files.join("\n")}`;
  },
  {
    name: "listDirectory",
    description: "列出目录中的文件和子目录",
    schema: z.object({
      dirPath: z.string().describe("目录路径"),
    }),
  },
);

export const executeCommandTool = tool(
  async ({ command, workDirectory }) => {
    const cwd = workDirectory || process.cwd();
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(" ");
      const child = spawn(cmd, args, { shell: true, stdio: "inherit", cwd });

      let errorMsg = "";

      child.on("error", (error) => {
        errorMsg = error.message;
      });

      child.on("exit", (code) => {
        if (code === 0) {
          console.log(`[工具调用][executeCommand] 成功执行命令 "${command}"`);
          resolve(`成功执行命令: ${command}`);
        } else {
          console.error(
            `[工具调用][executeCommand] 命令 "${command}" 执行失败，退出码: ${code}`,
          );
          resolve(
            `命令 "${command}" 执行失败 退出码: ${code} ${errorMsg ? `，错误信息: ${errorMsg}` : ""}`,
          );
        }
      });
    });
  },
  {
    name: "executeCommand",
    description: "执行系统命令",
    schema: z.object({
      command: z.string().describe("要执行的系统命令"),
      workDirectory: z.string().describe("命令执行的工作目录"),
    }),
  },
);
