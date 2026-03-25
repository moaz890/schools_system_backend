"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureLogoUploadDir = ensureLogoUploadDir;
exports.getLogoMulterOptions = getLogoMulterOptions;
exports.getPublicLogoUrl = getPublicLogoUrl;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const multer_1 = require("multer");
function ensureLogoUploadDir() {
    const uploadBaseDir = (0, path_1.join)(process.cwd(), process.env.UPLOAD_DEST || './uploads');
    const logoUploadDir = (0, path_1.join)(uploadBaseDir, 'logos');
    fs_1.default.mkdirSync(logoUploadDir, { recursive: true });
    return logoUploadDir;
}
function getLogoMulterOptions() {
    const destination = ensureLogoUploadDir();
    return {
        storage: (0, multer_1.diskStorage)({
            destination,
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                cb(null, `logo-${unique}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (_req, file, cb) => {
            const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
            if (!allowed.includes((0, path_1.extname)(file.originalname).toLowerCase())) {
                return cb(new common_1.BadRequestException('Only image files are allowed (jpg, png, webp, svg)'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    };
}
function getPublicLogoUrl(filename) {
    return `/uploads/logos/${filename}`;
}
//# sourceMappingURL=logo-upload.helper.js.map