const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto = require('crypto');

const app      = express();
const DATA_DIR  = '/data';
const DATA_FILE = path.join(DATA_DIR, 'posts.json');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helpers
function readPosts() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writePosts(posts) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// Routes
app.get('/', (req, res) => {
    const posts = readPosts();
    res.render('index', { posts });
});

app.post('/add', (req, res) => {
    const { title, content } = req.body;
    if (title && content) {
        const posts = readPosts();
        posts.push({
            id: crypto.randomUUID().slice(0, 8),
            title,
            content,
            created_at: new Date().toLocaleString()
        });
        writePosts(posts);
    }
    res.redirect('/');
});

app.get('/delete/:id', (req, res) => {
    const posts = readPosts().filter(p => p.id !== req.params.id);
    writePosts(posts);
    res.redirect('/');
});

app.listen(5000, '0.0.0.0', () => {
    console.log('Content Manager running on http://0.0.0.0:5000');
});
