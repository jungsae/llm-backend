import { Pool } from 'pg';
import config from '../config/index.js';

const pool = new Pool(config.db);

export const query = async (text, params) => {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
};

export const getClient = async () => {
    const client = await pool.connect();
    return client;
}; 