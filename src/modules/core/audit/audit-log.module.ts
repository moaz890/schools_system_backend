import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAuditLog } from './entities/auth-audit-log.entity';
import { AuthAuditLogService } from './services/auth-audit-log.service';
import { AuthSecurityAuditService } from './services/auth-security-audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthAuditLog])],
  providers: [AuthAuditLogService, AuthSecurityAuditService],
  exports: [AuthSecurityAuditService],
})
export class AuditLogModule {}
