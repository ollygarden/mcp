import { createMcpHandler } from "@modelcontextprotocol/server";
import { createServer } from "./server.ts";

export default createMcpHandler(createServer);
