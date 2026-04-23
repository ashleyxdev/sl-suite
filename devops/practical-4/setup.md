# CI/CD with Jenkins — Setup & Practical Guide

## Prerequisites

- WSL Ubuntu with Docker Desktop running
- Jenkins running in Docker (see Practical 3 setup)
- Node.js installed locally (for initial testing)
- A GitHub account
- The Express.js Content Manager app

---

## Part 1: Prepare the Application

### Step 1: Initial Project Structure

Your starting project should look like:
```
jenkins-demo/
├── app.js
├── views/
│   └── index.ejs
└── package.json
```

---

### Step 2: Update app.js for Testability

The app needs two changes to work properly with automated tests:

**Change 1** — Make the data directory configurable via environment variable.

Find this at the top of `app.js`:
```javascript
const DATA_DIR  = '/data';
const DATA_FILE = path.join(DATA_DIR, 'posts.json');
```

Replace with:
```javascript
const DATA_DIR  = process.env.DATA_DIR || '/data';
const DATA_FILE = path.join(DATA_DIR, 'posts.json');
```

**Change 2** — Export the app so tests can import it without auto-starting the server.

Find the bottom of `app.js`:
```javascript
app.listen(5000, '0.0.0.0', () => {
    console.log('Content Manager running on http://0.0.0.0:5000');
});
```

Replace with:
```javascript
if (require.main === module) {
    app.listen(5000, '0.0.0.0', () => {
        console.log('Content Manager running on http://0.0.0.0:5000');
    });
}

module.exports = app;
```

---

### Step 3: Install Testing Libraries

```bash
npm install --save-dev jest supertest
```

---

### Step 4: Update package.json Scripts

Add the test script to `package.json`:
```json
"scripts": {
    "start": "node app.js",
    "test": "jest --forceExit"
}
```

---

### Step 5: Create Test File

```bash
mkdir test
```

Create `test/app.test.js`:
```javascript
const path = require('path');
const os   = require('os');
const fs   = require('fs');

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
```

Verify tests pass locally:
```bash
npm test
```

Expected output:
```
PASS  test/app.test.js
  Content Manager App
    ✓ GET / returns 200
    ✓ POST /add redirects after adding post
Tests: 2 passed, 2 total
```

---

### Step 6: Create Dockerfile

Create `Dockerfile` in the project root:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "app.js"]
```

---

### Step 7: Create .dockerignore

Create `.dockerignore` in the project root:
```
node_modules
npm-debug.log
.git
test
.dockerignore
```

---

### Step 8: Test Docker Build Locally

```bash
docker build -t content-manager .
```

Run it to verify:
```bash
docker run -d \
  --name content-manager \
  -p 5000:5000 \
  -v content-data:/data \
  content-manager
```

Open `http://localhost:5000` — app should be live.

Clean up after verifying:
```bash
docker stop content-manager
docker rm content-manager
```

---

### Step 9: Create Jenkinsfile

Create `Jenkinsfile` in the project root:
```groovy
pipeline {
    agent any

    environment {
        IMAGE_NAME     = 'content-manager'
        CONTAINER_NAME = 'content-manager-app'
        APP_PORT       = '5000'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code from GitHub...'
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                echo '📦 Installing dependencies and running tests...'
                sh '''
                    docker run --rm \
                        -v ${WORKSPACE}:/app \
                        -w /app \
                        -e DATA_DIR=/tmp/test-data \
                        node:18-alpine \
                        sh -c "npm install && npm test"
                '''
            }
        }

        stage('Build') {
            steps {
                echo '🔨 Building Docker image...'
                sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .'
                sh 'docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest'
                echo "✅ Image built: ${IMAGE_NAME}:${BUILD_NUMBER}"
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying application...'
                sh '''
                    if [ $(docker ps -aq -f name=${CONTAINER_NAME}) ]; then
                        echo "Stopping old container..."
                        docker stop ${CONTAINER_NAME}
                        docker rm ${CONTAINER_NAME}
                    fi
                '''
                sh '''
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p ${APP_PORT}:5000 \
                        -v content-data:/data \
                        ${IMAGE_NAME}:latest
                '''
                echo "✅ App deployed at http://localhost:${APP_PORT}"
            }
        }

    }

    post {
        success {
            echo '🎉 Pipeline completed! App is live at http://localhost:5000'
        }
        failure {
            echo '❌ Pipeline failed! Check the logs above.'
            sh '''
                if [ $(docker ps -aq -f name=${CONTAINER_NAME}) ]; then
                    docker stop ${CONTAINER_NAME}
                    docker rm ${CONTAINER_NAME}
                fi
            '''
        }
        always {
            echo '🧹 Cleaning up...'
        }
    }
}
```

---

## Part 2: Push to GitHub

### Step 10: Create GitHub Repository

1. Go to [github.com](https://github.com) → **New Repository**
2. Name: `jenkins-demo`
3. Visibility: **Public**
4. Do NOT initialize with README

### Step 11: Push Code

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/jenkins-demo.git
git push -u origin main
```

Your final structure on GitHub should be:
```
jenkins-demo/
├── app.js
├── views/index.ejs
├── test/app.test.js
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
└── Jenkinsfile
```

---

## Part 3: Configure Jenkins with Docker Access

Jenkins needs access to the host Docker daemon to run `docker build` and `docker run` inside the pipeline.

### Step 12: Recreate Jenkins Container with Docker Access

Stop and remove the existing Jenkins container:
```bash
docker stop jenkins
docker rm jenkins
```

Recreate it with Docker socket mounted:
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(which docker):/usr/bin/docker \
  --group-add $(stat -c '%g' /var/run/docker.sock) \
  jenkins/jenkins:lts
```

### Step 13: Verify Docker Works Inside Jenkins

```bash
docker exec jenkins docker ps
```

You should see a table output (even if empty). If you get a permission error, run:
```bash
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

---

## Part 4: Create Jenkins Pipeline Job

### Step 14: Create New Pipeline Job

1. Open `http://localhost:8080` and log in
2. Click **+ New Item**
3. Name: `content-manager-pipeline`
4. Select **Pipeline**
5. Click **OK**

### Step 15: Configure the Job

1. Add description: `CI/CD pipeline for Content Manager Express app`
2. Scroll down to the **Pipeline** section
3. Change **Definition** to `Pipeline script from SCM`
4. Set **SCM** to `Git`
5. Set **Repository URL** to `https://github.com/<your-username>/jenkins-demo.git`
6. Set **Branch Specifier** to `*/main`
7. Verify **Script Path** is `Jenkinsfile`
8. Click **Save**

---

## Part 5: Run the Pipeline

### Step 16: Trigger the Build

Click **Build Now** in the left sidebar.

Watch the **Stage View** update in real time:
```
         Checkout   Install & Test   Build   Deploy
  #1        ✅            ✅            ✅       ✅
```

### Step 17: Verify the App is Running

Open `http://localhost:5000` in your browser.

You should see the Content Manager app live, deployed by Jenkins!

---

## Part 6: Demonstrate CI/CD (The Key Demo)

This is what makes it CI/CD — make a code change and watch Jenkins automatically build and deploy it.

### Step 18: Make a Code Change

Edit `views/index.ejs` — change the heading:
```html
<h1>📝 Content Manager</h1>
```
to:
```html
<h1>📝 Content Manager v2</h1>
```

### Step 19: Push the Change

```bash
git add .
git commit -m "update heading to v2"
git push origin main
```

### Step 20: Trigger Jenkins and Verify

1. Go to Jenkins → Click **Build Now**
2. Watch the pipeline run through all stages
3. Open `http://localhost:5000` — heading should now say **Content Manager v2**

This demonstrates the full CI/CD loop:
```
Code change → Push to GitHub → Jenkins builds & tests → Deploys automatically
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start Jenkins | `docker start jenkins` |
| Stop Jenkins | `docker stop jenkins` |
| View Jenkins logs | `docker logs jenkins` |
| Check app is running | `docker ps` |
| View app logs | `docker logs content-manager-app` |
| Stop deployed app | `docker stop content-manager-app` |
| Open Jenkins UI | `http://localhost:8080` |
| Open deployed app | `http://localhost:5000` |
| Run tests locally | `npm test` |
| Build image manually | `docker build -t content-manager .` |
