# CI/CD with Jenkins — Theory

## 1. What is This Practical About?

This practical demonstrates a real-world **CI/CD pipeline** using Jenkins, Docker, and GitHub. We take an existing Express.js web application and automate its entire lifecycle — from code push to live deployment — using Jenkins as the automation server.

---

## 2. The Application

The application is a **Content Manager** built with Express.js. It allows users to:
- Add posts (title + content)
- View all posts
- Delete posts

Posts are stored as a JSON file on disk at `/data/posts.json`. The app uses **EJS** as its templating engine and runs on port **5000**.

---

## 3. CI/CD Pipeline Overview

```
Developer pushes code to GitHub
            |
            ▼
    Jenkins detects change
            |
            ▼
  ┌─────────────────────┐
  │  Stage: Checkout    │ → Pull latest code from GitHub
  ├─────────────────────┤
  │  Stage: Install     │ → npm install dependencies
  │         & Test      │ → npm test (Jest)
  ├─────────────────────┤
  │  Stage: Build       │ → docker build image
  ├─────────────────────┤
  │  Stage: Deploy      │ → stop old container, run new one
  └─────────────────────┘
            |
            ▼
  App live at localhost:5000
```

---

## 4. Project Structure

```
jenkins-demo/
├── app.js                 → Express application
├── views/
│   └── index.ejs          → EJS template
├── test/
│   └── app.test.js        → Jest + Supertest tests
├── package.json           → Node.js dependencies and scripts
├── Dockerfile             → Instructions to containerise the app
├── .dockerignore          → Files to exclude from Docker image
└── Jenkinsfile            → CI/CD pipeline definition
```

---

## 5. Automated Testing

### Why Tests in CI/CD?
Tests are the **safety gate** of CI/CD. Jenkins runs tests automatically on every build. If tests fail, the pipeline stops and nothing gets deployed — preventing broken code from reaching production.

### Testing Libraries Used

| Library | Purpose |
|---------|---------|
| **Jest** | JavaScript testing framework — runs test suites |
| **Supertest** | HTTP assertion library — makes real HTTP requests to the app in tests |

### How the Tests Work

```javascript
// Set temp data dir BEFORE importing app
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jenkins-test-'));
process.env.DATA_DIR = tmpDir;

const app = require('../app');
```

The test:
1. Creates a **temporary directory** for test data so it does not interfere with real data
2. Sets `DATA_DIR` environment variable before importing the app
3. Starts the app on port **5001** (different from production port 5000)
4. Runs HTTP requests against it
5. Cleans up the temp directory after tests finish

### Why `require.main === module`?

```javascript
if (require.main === module) {
    app.listen(5000, '0.0.0.0', () => { ... });
}
module.exports = app;
```

This pattern ensures:
- When run directly (`node app.js`) → server starts on port 5000
- When imported by tests (`require('../app')`) → server does NOT auto-start, letting the test control the port

Without this, the app would try to start on port 5000 during testing, potentially conflicting with a running instance.

### Environment-Driven Data Path

```javascript
const DATA_DIR = process.env.DATA_DIR || '/data';
```

This makes the data directory **configurable via environment variable**:
- In production → uses `/data` (default)
- In tests → uses a temp directory set by the test file
- In Jenkins → uses `/tmp/test-data`

---

## 6. Docker

### What is Docker?
Docker packages an application and all its dependencies into a **container** — an isolated, portable environment that runs the same way everywhere.

```
Without Docker                 With Docker
──────────────                 ────────────
Works on my machine     →      Works everywhere
Manual dependency setup →      Everything bundled in image
Hard to replicate       →      docker run = instant replica
```

### Dockerfile Explained

```dockerfile
FROM node:18-alpine
```
Use a lightweight Node.js base image (Alpine Linux = minimal size)

```dockerfile
WORKDIR /app
```
Set `/app` as the working directory inside the container

```dockerfile
COPY package*.json ./
RUN npm install --production
```
Copy package files first and install dependencies. This is a **layer caching** optimisation — if only your code changes but not dependencies, Docker skips reinstalling packages on the next build, making it significantly faster.

```dockerfile
COPY . .
```
Copy the rest of the application code

```dockerfile
EXPOSE 5000
```
Documents that the app listens on port 5000 (informational, does not actually open the port)

```dockerfile
CMD ["node", "app.js"]
```
The command to run when the container starts

### .dockerignore
Prevents unnecessary files from being included in the Docker image:
```
node_modules     → not needed, will be installed fresh inside container
npm-debug.log    → debug logs
.git             → version control metadata
test             → test files not needed in production image
```

### Docker Volume for Data Persistence
```bash
docker run -v content-data:/data content-manager
```
The `-v content-data:/data` flag mounts a **named volume** to `/data` inside the container. This means:
- Posts data persists even if the container is stopped or replaced
- Every new deployment reuses the same data volume
- Data is never lost during redeployments

---

## 7. Jenkinsfile and Pipeline as Code

### What is a Jenkinsfile?
A `Jenkinsfile` is a text file stored in your Git repository that defines your entire CI/CD pipeline as code. Benefits:

- **Version controlled** — pipeline changes are tracked in Git
- **Auditable** — you can see who changed the pipeline and when
- **Portable** — works on any Jenkins instance
- **Reviewed** — pipeline changes go through code review like any other code

### Pipeline Script from SCM
Instead of typing the pipeline script directly in Jenkins UI, we configure Jenkins to read the Jenkinsfile from the repository:
```
Jenkins Job
└── Definition: Pipeline script from SCM
      └── SCM: Git
            └── Repo: https://github.com/<user>/jenkins-demo.git
                  └── Branch: main
                        └── Script Path: Jenkinsfile
```
This means every time you push a new `Jenkinsfile` to GitHub, Jenkins automatically uses the updated pipeline on the next build.

---

## 8. Jenkinsfile Breakdown

### Environment Block
```groovy
environment {
    IMAGE_NAME     = 'content-manager'
    CONTAINER_NAME = 'content-manager-app'
    APP_PORT       = '5000'
}
```
Defines pipeline-wide environment variables. Using variables instead of hardcoded values makes the pipeline easy to maintain and reuse across environments.

### Stage: Checkout
```groovy
stage('Checkout') {
    steps {
        checkout scm
    }
}
```
`checkout scm` tells Jenkins to pull the latest code from the configured Git repository. `scm` refers to the Source Code Management configuration defined in the job settings.

### Stage: Install & Test
```groovy
stage('Install & Test') {
    steps {
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
```
Since Jenkins does not have Node.js installed, we spin up a **temporary Node.js Docker container** to run the tests:

| Flag | Purpose |
|------|---------|
| `--rm` | Automatically remove container after it exits |
| `-v ${WORKSPACE}:/app` | Mount Jenkins workspace (with your code) into the container |
| `-w /app` | Set working directory inside the container |
| `-e DATA_DIR=/tmp/test-data` | Pass environment variable so tests use a temp data path |
| `node:18-alpine` | Use the official Node.js Docker image |

### Stage: Build
```groovy
stage('Build') {
    steps {
        sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .'
        sh 'docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest'
    }
}
```
Builds the Docker image and tags it **twice**:
- `content-manager:1` → specific build number, useful for rollbacks
- `content-manager:latest` → always points to the most recent build

### Stage: Deploy
```groovy
stage('Deploy') {
    steps {
        sh '''
            if [ $(docker ps -aq -f name=${CONTAINER_NAME}) ]; then
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
    }
}
```
The deploy stage:
1. **Checks** if an old container is running using `docker ps -aq -f name=...`
2. **Stops and removes** it if it exists
3. **Starts** a new container from the freshly built image

### Post Block
```groovy
post {
    success { echo '🎉 Pipeline completed!' }
    failure  { sh 'docker stop ${CONTAINER_NAME} || true' }
    always   { echo '🧹 Cleaning up...' }
}
```

| Condition | Runs when |
|-----------|-----------|
| `success` | All stages passed |
| `failure` | Any stage failed — cleans up partial containers |
| `always` | Every time regardless of outcome |

---

## 9. Docker Outside of Docker (DooD)

### The Problem
Jenkins runs inside a Docker container. Our pipeline needs to run `docker build` and `docker run` commands. But Docker is not installed inside the Jenkins container.

### The Solution — DooD
Mount the **host machine's Docker socket** into the Jenkins container:

```bash
docker run \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(which docker):/usr/bin/docker \
  --group-add $(stat -c '%g' /var/run/docker.sock) \
  jenkins/jenkins:lts
```

| Flag | Purpose |
|------|---------|
| `-v /var/run/docker.sock:/var/run/docker.sock` | Mount host Docker socket into Jenkins |
| `-v $(which docker):/usr/bin/docker` | Make Docker CLI available inside Jenkins |
| `--group-add` | Give Jenkins the correct group permissions to use Docker |

```
Jenkins Container
└── /var/run/docker.sock  ──────────►  Host Docker Daemon
                                              |
                                    builds/runs containers
                                    on the HOST machine
```

Containers started by Jenkins are **siblings** of the Jenkins container — they all run on the same Docker host, not nested inside Jenkins.

---

## 10. Full CI/CD Picture

```
Developer workflow:
───────────────────
1. Write/update code locally
2. git push origin main
3. Jenkins triggered (manually or via webhook)
4. Pipeline runs:
   Checkout  → pulls fresh code from GitHub
   Test      → spins up Node container, runs Jest tests
               if tests fail → pipeline stops, nothing deployed
   Build     → builds Docker image, tags with build number
   Deploy    → stops old container, starts new one
5. App is live with latest changes at localhost:5000
```

### Build Versioning
Every build produces a tagged image:
```
content-manager:1   → Build #1
content-manager:2   → Build #2
content-manager:3   → Build #3  ← latest
```
This enables **rollback** — if Build #3 has a bug, you can instantly redeploy Build #2:
```bash
docker run content-manager:2
```

---

## 11. Key Concepts Summary

| Concept | What it means in this practical |
|---------|----------------------------------|
| **CI** | Every push triggers install + test automatically |
| **CD** | Every passing build gets deployed automatically |
| **Pipeline as Code** | Jenkinsfile lives in Git alongside app code |
| **Containerisation** | App packaged in Docker for consistent deployments |
| **Layer Caching** | Docker skips reinstalling unchanged dependencies |
| **Volume Persistence** | Data survives container replacements |
| **DooD** | Jenkins uses host Docker to build/run containers |
| **Test Isolation** | Tests use temp directory, never touch real data |
| **Build Tagging** | Every image tagged with build number for rollbacks |
