import { SessionsService } from './sessions.service';
import type { AuthCaller } from '../users/types/auth-caller.type';
export declare class UserSessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    listForUser(id: string, caller: AuthCaller): Promise<import("./sessions.service").SessionListItem[]>;
}
