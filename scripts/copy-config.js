import { writeFileSync } from 'fs';
import { join } from 'path';

const distPath = join(process.cwd(), 'dist');

// 創建 _headers 文件（用於 Netlify/Vercel）
const headersContent = `# 確保 JavaScript 文件使用正確的 MIME 類型
/*.js
  Content-Type: application/javascript; charset=utf-8
/*.mjs
  Content-Type: application/javascript; charset=utf-8
/*.css
  Content-Type: text/css; charset=utf-8
/*.json
  Content-Type: application/json; charset=utf-8
`;

// 創建 .htaccess 文件（用於 Apache）
const htaccessContent = `# 確保 JavaScript 文件使用正確的 MIME 類型
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType application/javascript .mjs
  AddType text/css .css
  AddType application/json .json
</IfModule>

# 啟用 Gzip 壓縮
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# 緩存設置
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
</IfModule>
`;

try {
  writeFileSync(join(distPath, '_headers'), headersContent);
  writeFileSync(join(distPath, '.htaccess'), htaccessContent);
  console.log('✅ 配置文件已複製到 dist 文件夾');
} catch (error) {
  console.error('❌ 複製配置文件時出錯:', error);
  process.exit(1);
}
