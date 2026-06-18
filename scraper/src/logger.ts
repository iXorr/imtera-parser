import pino from "pino";
import pinoPretty from "pino-pretty";
import { Writable } from "node:stream";

interface WriteDestination {
  write(chunk: string): unknown;
}

// pino-pretty гоняет destination через pump(), которому нужен настоящий
// stream (не объект с одним .write) — без этой обёртки записи
// слипаются без пустой строки между ними.
function withBlankLineSeparator(destination: WriteDestination): Writable {
  return new Writable({
    write(chunk, _encoding, callback) {
      destination.write(chunk.toString() + "\n");
      callback();
    },
  });
}

const TIME_FORMAT = "SYS:dd-mm-yyyy HH:MM:ss.l";

const consoleSink = withBlankLineSeparator(process.stdout);
const fileSonicBoom = pino.destination({ dest: "./logs/app.log", mkdir: true });
const fileSink = withBlankLineSeparator(fileSonicBoom);
const consoleStream = pinoPretty({ destination: consoleSink, translateTime: TIME_FORMAT });

const fileStream = pinoPretty({
  destination: fileSink,
  colorize: false,
  translateTime: TIME_FORMAT,
});

export const logger = pino(
  {},
  pino.multistream([
    { stream: consoleStream, level: "info" },
    { stream: fileStream, level: "info" },
  ]),
);
