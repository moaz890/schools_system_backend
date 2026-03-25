"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalFileInterceptor = ConditionalFileInterceptor;
const common_1 = require("@nestjs/common");
const multer_1 = __importDefault(require("multer"));
const multer_utils_1 = require("@nestjs/platform-express/multer/multer/multer.utils");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
function ConditionalFileInterceptor(fieldName, localOptions) {
    const multipartMulter = (0, multer_1.default)(localOptions);
    let ConditionalMixinInterceptor = class ConditionalMixinInterceptor {
        intercept(context, next) {
            const ctx = context.switchToHttp();
            const request = ctx.getRequest();
            const response = ctx.getResponse();
            const contentType = request?.headers?.['content-type'];
            const isMultipart = typeof contentType === 'string' &&
                contentType.toLowerCase().includes('multipart/');
            if (!isMultipart) {
                return next.handle();
            }
            return (0, rxjs_1.from)(new Promise((resolve, reject) => {
                multipartMulter.single(fieldName)(request, response, (err) => {
                    if (err)
                        return reject((0, multer_utils_1.transformException)(err));
                    resolve();
                });
            })).pipe((0, operators_1.switchMap)(() => next.handle()));
        }
    };
    ConditionalMixinInterceptor = __decorate([
        (0, common_1.Injectable)()
    ], ConditionalMixinInterceptor);
    return (0, common_1.mixin)(ConditionalMixinInterceptor);
}
//# sourceMappingURL=conditional-file.interceptor.js.map