import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService, logger: AppLoggerService);
    sendPasswordReset(params: {
        to: string;
        resetUrl: string;
        firstName: string;
        userId: string;
        schoolId: string | null;
    }): Promise<void>;
}
