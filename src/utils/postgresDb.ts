import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';

let pool: Pool | undefined;

const getSecret = async () => {
  const secretName = process.env.SECRET_ID!;

  const client = new SecretsManagerClient({});
  const result = await client.send(new GetSecretValueCommand({ SecretId: secretName }));

  if (!result.SecretString) {
    throw new Error('[getSecret] SecretString is empty');
  }

  const parsedSecret = JSON.parse(result.SecretString);

  return parsedSecret;
};

const getPool = async (): Promise<Pool> => {
  if (pool) {
    console.log('[getPool] Reusing existing connection pool');
    return pool;
  }

  const secret = await getSecret();

  console.log('[getPool] Initializing new pool with config:', {
    host: secret.host,
    port: secret.port,
    database: secret.dbname,
    user: secret.username,
    ssl: true,
  });

  pool = new Pool({
    host: secret.host,
    port: parseInt(secret.port || '5432'),
    database: secret.dbname,
    user: secret.username,
    password: secret.password,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
};

export const query = async (text: string, params?: Array<string | number | boolean | null>) => {
  const client = await getPool();

  console.log('[query] Executing query:', text);
  if (params) console.log('[query] With parameters:', params);

  const result = await client.query(text, params);

  console.log('[query] Rows returned:', result.rowCount);
  return result;
};
