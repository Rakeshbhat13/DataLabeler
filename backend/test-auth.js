const http = require('http');
const data = JSON.stringify({ email: 'test@example.com', password: 'pass123', role: 'manager' });

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log('body', body);
  });
});

req.on('error', (err) => {
  console.error(err);
});
req.write(data);
req.end();
