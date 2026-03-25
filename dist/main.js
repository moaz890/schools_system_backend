"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_logging_interceptor_1 = require("./common/interceptors/http-logging.interceptor");
const logger_service_1 = require("./modules/core/logger/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const logger = app.get(logger_service_1.AppLoggerService);
    const prefix = configService.get('app.prefix') || 'api/v1';
    app.setGlobalPrefix(prefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new http_logging_interceptor_1.HttpLoggingInterceptor(logger));
    const corsOrigins = configService.get('app.corsOrigins') || ['*'];
    app.enableCors({
        origin: corsOrigins,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    const uploadDest = configService.get('app.uploadDest') || './uploads';
    app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), uploadDest)));
    const env = configService.get('app.env');
    if (env !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Schools Platform API')
            .setDescription('Backend API for the Schools Management Platform')
            .setVersion('1.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup(`${prefix}/docs`, app, document);
    }
    const port = configService.get('app.port') || 3000;
    await app.listen(port);
    console.log(`🚀 Server running on: http://localhost:${port}/${prefix}`);
    if (env !== 'production') {
        console.log(`📖 Swagger docs at: http://localhost:${port}/${prefix}/docs`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map