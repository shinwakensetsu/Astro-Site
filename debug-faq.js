import { createClient } from 'microcms-js-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple .env parser
const envPath = path.resolve(__dirname, '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envConfig[key] = value;
    }
  });
}

const client = createClient({
  serviceDomain: envConfig.MICROCMS_SERVICE_DOMAIN,
  apiKey: envConfig.MICROCMS_API_KEY,
});

(async () => {
  try {
    console.log('Fetching FAQ...');
    // Try fetching as list first
    const res = await client.get({ endpoint: 'faq' });
    console.log('Response:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
})();
