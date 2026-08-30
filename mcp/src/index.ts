#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readConfig } from './config.js';
import { TodogenClient } from './todogen-client.js';
import { registerTaskTools } from './tools.js';

/**
 * 에이전트가 붙는 자리. 클라이언트가 이 프로세스를 띄우고 표준입출력으로 말한다.
 *
 * <p>표준출력은 프로토콜이 쓰는 통로다. 알림이나 오류를 그리로 내보내면 대화가 깨지므로 사람에게
 * 하는 말은 모두 표준오류로 낸다.
 */
async function main(): Promise<void> {
  const config = readConfig();

  const server = new McpServer({ name: 'todogen', version: '0.1.0' });
  registerTaskTools(server, new TodogenClient(config));

  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
