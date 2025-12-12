import { Injectable, NestMiddleware } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const logDir = path.join(process.cwd(), "logs");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const file = path.join(logDir, "report.log");
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;

    fs.appendFileSync(file, log);

    next();
  }
}
