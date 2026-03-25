"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    port: parseInt(process.env.APP_PORT || '3000', 10),
    env: process.env.APP_ENV || 'development',
    prefix: process.env.API_PREFIX || 'api/v1',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001').split(','),
    uploadDest: process.env.UPLOAD_DEST || './uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
}));
//# sourceMappingURL=app.config.js.map