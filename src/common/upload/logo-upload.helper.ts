import fs from 'fs';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

export function ensureLogoUploadDir(): string {
    const uploadBaseDir = join(
        process.cwd(),
        process.env.UPLOAD_DEST || './uploads',
    );
    const logoUploadDir = join(uploadBaseDir, 'logos');
    fs.mkdirSync(logoUploadDir, { recursive: true });
    return logoUploadDir;
}

export function getLogoMulterOptions() {
    const destination = ensureLogoUploadDir();

    return {
        storage: diskStorage({
            destination,
            filename: (_req: unknown, file: Express.Multer.File, cb: any) => {
                const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                cb(null, `logo-${unique}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (_req: unknown, file: Express.Multer.File, cb: any) => {
            const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
            if (!allowed.includes(extname(file.originalname).toLowerCase())) {
                return cb(
                    new BadRequestException(
                        'Only image files are allowed (jpg, png, webp, svg)',
                    ),
                    false,
                );
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    };
}

export function getPublicLogoUrl(filename: string): string {
    return `/uploads/logos/${filename}`;
}

