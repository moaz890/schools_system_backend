"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentSchool = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentSchool = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.schoolId ?? null;
});
//# sourceMappingURL=current-school.decorator.js.map