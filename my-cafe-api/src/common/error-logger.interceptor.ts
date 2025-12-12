import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class ErrorLogger implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        const logDir = path.join(process.cwd(), "logs");
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

        const file = path.join(logDir, "report.log");
        const log = `[${new Date().toISOString()}] ERROR: ${
          err.message
        }\n`;

        fs.appendFileSync(file, log);

        return throwError(() => err);
      })
    );
  }
}
