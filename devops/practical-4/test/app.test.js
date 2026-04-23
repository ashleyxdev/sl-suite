const path    = require('path');
const os      = require('os');
const fs      = require('fs');

// Set temp data dir BEFORE importing app
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jenkins-test-'));
process.env.DATA_DIR = tmpDir;

const request = require('supertest');
const app     = require('../app');

let server;

beforeAll(() => {
    server = app.listen(5001);
});

afterAll((done) => {
    server.close(done);
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('Content Manager App', () => {

    test('GET / returns 200', async () => {
        const res = await request(server).get('/');
        expect(res.statusCode).toBe(200);
    });

    test('POST /add redirects after adding post', async () => {
        const res = await request(server)
            .post('/add')
            .send('title=TestTitle&content=TestContent');
        expect(res.statusCode).toBe(302);
    });

});
