"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
require("dotenv/config");
const general_1 = require("../helpers/general");
exports.dataSourceOptions = {
    type: 'postgres',
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    host: process.env.DB_HOST,
    entities: [(0, general_1.pathFromSrc)('/**/*.entity.{js,ts}')],
    migrations: [(0, general_1.pathFromSrc)('config/migrations/**/*.{js,ts}')],
};
const dataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = dataSource;
dataSource
    .initialize()
    .then(() => {
    console.log('Database connection established successfully!');
})
    .catch((error) => {
    console.error('Error connecting to the database:', error);
});
//# sourceMappingURL=db.config.js.map