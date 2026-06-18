// logger.js

import pino from "pino";
import pinoPretty from "pino-pretty";
import { Writable } from "node:stream";

const isProduction = process.env.NODE_ENV === "production";

// Ни pino-pretty, ни сырой JSON не добавляют пустую строку между записями —
// лог выглядит слипшимся. Оборачиваем конечный destination реальным
// Writable-стримом (pino-pretty гоняет его через pump(), которому нужен
// настоящий stream, а не объект с одним .write), добавляя лишний перенос
// строки после каждой записи.
function withBlankLineSeparator(destination) {
  return new Writable({
    write(chunk, encoding, callback) {
      destination.write(chunk.toString() + "\n");
      callback();
    },
  });
}

const consoleSink = withBlankLineSeparator(process.stdout);
const fileSonicBoom = pino.destination({ dest: "./logs/app.log", mkdir: true });
const fileSink = withBlankLineSeparator(fileSonicBoom);

// SYS: — локальное время системы (без префикса pino-pretty форматировал бы
// по UTC); дефолтный translateTime: true даёт только время без даты.
const TIME_FORMAT = "SYS:dd-mm-yyyy HH:MM:ss.l";

// Два получателя одновременно: консоль (pino-pretty везде, кроме production —
// там сырой JSON) и logs/app.log (всегда через pino-pretty, без цвета) — это
// и есть персистентное хранение логов запросов к серверу, см. server.js.
const consoleStream = isProduction
  ? consoleSink
  : pinoPretty({ destination: consoleSink, translateTime: TIME_FORMAT });
const fileStream = pinoPretty({ destination: fileSink, colorize: false, translateTime: TIME_FORMAT });

// {} первым аргументом обязателен: pino(streamLikeObject) с одним аргументом
// детектит multistream-объект (он просто {write, add, ...}) не как
// destination, а как options, и тихо игнорирует его, печатая сырой JSON
// напрямую в stdout мимо обеих наших обёрток.
export const logger = pino(
  {},
  pino.multistream([
    { stream: consoleStream, level: "info" },
    { stream: fileStream, level: "info" },
  ])
);
