export declare function ensureLogoUploadDir(): string;
export declare function getLogoMulterOptions(): {
    storage: import("multer").StorageEngine;
    fileFilter: (_req: unknown, file: Express.Multer.File, cb: any) => any;
    limits: {
        fileSize: number;
    };
};
export declare function getPublicLogoUrl(filename: string): string;
