import { UserRole } from '../../../../common/enums/user-role.enum';
import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
export declare class QueryUsersDto extends PaginationDto {
    role?: UserRole;
    status?: AccountStatus;
}
