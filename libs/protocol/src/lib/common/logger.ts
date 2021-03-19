import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: 'cast-protocol' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
      ),
    }),
  ],
});
