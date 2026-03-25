import { SessionsService } from './sessions.service';
import type { AuthCaller } from '../users/types/auth-caller.type';
export declare class RevokeSessionController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    revoke(id: string, caller: AuthCaller): Promise<void>;
}
