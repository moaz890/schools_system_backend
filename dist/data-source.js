"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env' });
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'schools_platform',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
});
//# sourceMappingURL=data-source.js.map