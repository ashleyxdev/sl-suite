# Jenkins CI/CD — Theory

## 1. The Problem CI/CD Solves

In a team of multiple developers, everyone writes code simultaneously. Without automation, someone has to manually:

- Merge everyone's code together
- Test whether it still works
- Build the application
- Deploy it to a server

Doing this manually is slow, error-prone, and unsustainable as teams grow. **CI/CD** was introduced to automate this entire workflow.

---

## 2. What is CI/CD?

### CI — Continuous Integration

The practice of automatically merging, building, and testing code **every time a developer pushes** changes to a shared repository. The goal is to catch integration bugs early.

### CD — Continuous Delivery

Automatically prepares the tested build so it is always in a **deployable state**. A human still approves the final deployment.

### CD — Continuous Deployment

Goes one step further — automatically deploys every passing build to production **without any manual intervention**.

### CI/CD Flow

```
Developer writes code
        |
        v
  Pushes to Git ──► CI kicks in automatically
                          |
                    ┌─────▼─────┐
                    │   Build   │  ← Compile / package the code
                    └─────┬─────┘
                          |
                    ┌─────▼─────┐
                    │   Test    │  ← Run automated tests
                    └─────┬─────┘
                          |
                    ┌─────▼─────┐
                    │  Deploy   │  ← CD sends it to server
                    └───────────┘
```

---

## 3. What is Jenkins?

Jenkins is an **open-source automation server** used to implement CI/CD pipelines. Think of it as a **robot manager** that:

- Watches your Git repository for changes
- Automatically triggers builds on new commits
- Runs your test suites
- Deploys your application
- Notifies your team on success or failure

```
Git Repo ──► Jenkins ──► Build ──► Test ──► Deploy ──► Notify
```

Jenkins achieves this through **Jobs** and **Pipelines**, which are configurable tasks that define what actions to take and when.

---

## 4. Key Jenkins Terminology

| Term               | Meaning                                                       |
| ------------------ | ------------------------------------------------------------- |
| **Job / Project**  | A task Jenkins performs (e.g. build this app)                 |
| **Build**          | One single execution of a job                                 |
| **Pipeline**       | A series of stages (Build → Test → Deploy) defined as code    |
| **Node / Agent**   | The machine where Jenkins runs jobs                           |
| **Plugin**         | Extra features that extend Jenkins functionality              |
| **Workspace**      | The folder inside Jenkins where project files are kept        |
| **Console Output** | Live logs showing what Jenkins is doing during a build        |
| **Jenkinsfile**    | A text file that defines a pipeline as code                   |
| **Stage**          | A named phase inside a pipeline (e.g. Build, Test, Deploy)    |
| **Step**           | An individual command or action inside a stage                |
| **Post Actions**   | Steps that run after all stages complete (success or failure) |

---

## 5. Jenkins Dashboard

The Jenkins dashboard is the main UI, structured as follows:

```
Jenkins Dashboard
├── New Item        → Create Jobs or Pipelines
├── People          → Users who have interacted with Jenkins
├── Build History   → Timeline of all past builds
└── Manage Jenkins  → Settings, plugins, credentials, nodes
```

### Manage Jenkins subsections:

```
Manage Jenkins
├── System Configuration
│     ├── System        → Global settings, environment variables
│     └── Plugins       → Install or remove features
├── Security
│     ├── Users         → Manage user accounts
│     └── Credentials   → Securely store passwords and API keys
└── Tools & Nodes
      └── Nodes         → Machines that run your jobs
```

---

## 6. Jenkins Job Types

| Job Type                        | Use When                                                |
| ------------------------------- | ------------------------------------------------------- |
| **Freestyle Project**           | Simple tasks, beginner-friendly, UI-based configuration |
| **Pipeline**                    | Multi-stage CI/CD flow defined as code                  |
| **Multi-configuration Project** | Testing across multiple environments/OS/browsers        |
| **Folder**                      | Organising multiple jobs together                       |
| **Multibranch Pipeline**        | Automatically create a pipeline per Git branch          |
| **Organization Folder**         | Scan an entire GitHub organisation for repos            |

---

## 7. Freestyle Job

A Freestyle job is the simplest job type in Jenkins. It is configured entirely through the UI and runs commands sequentially. The configuration sections are:

| Section                    | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| **General**                | Description, discard old builds, parameterisation     |
| **Source Code Management** | Connect a Git repository                              |
| **Triggers**               | When to run — manually, on schedule, on Git push      |
| **Environment**            | Set environment variables                             |
| **Build Steps**            | The actual commands to execute (e.g. shell scripts)   |
| **Post-build Actions**     | Send notifications, archive files, trigger other jobs |

### Built-in Environment Variables

Jenkins automatically provides variables such as:

- `$BUILD_NUMBER` — the sequential number of the current build
- `$JOB_NAME` — the name of the job
- `$WORKSPACE` — the path to the job's workspace folder

---

## 8. Pipeline Job and Jenkinsfile

A **Pipeline job** defines the CI/CD workflow as code using a **Jenkinsfile**. This is the industry-standard approach because:

- The pipeline lives in your Git repository alongside your code
- It is version-controlled and auditable
- It is reusable and portable across environments
- It gives a visual stage-by-stage breakdown of every build

### Freestyle vs Pipeline

| Aspect         | Freestyle             | Pipeline           |
| -------------- | --------------------- | ------------------ |
| Configuration  | Clicks in UI          | Code (Jenkinsfile) |
| Complexity     | Single step           | Multiple stages    |
| Visibility     | Basic logs            | Visual stage view  |
| Reusability    | Not reusable          | Stored in Git      |
| Industry usage | Learning/simple tasks | Real-world CI/CD   |

---

## 9. Jenkinsfile Structure

A Jenkinsfile uses a **Declarative Pipeline** syntax written in Groovy:

```groovy
pipeline {
    agent any          // Run on any available machine

    stages {

        stage('Build') {
            steps {
                echo 'Building the app...'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying app...'
            }
        }

    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed! Check the logs.'
        }
    }
}
```

### Key Blocks Explained

| Block              | Meaning                                         |
| ------------------ | ----------------------------------------------- |
| `pipeline {}`      | Root block that wraps the entire pipeline       |
| `agent any`        | Run on any available Jenkins node/machine       |
| `stages {}`        | Container that holds all stage definitions      |
| `stage('name') {}` | A named phase of the pipeline                   |
| `steps {}`         | The actual commands to run inside a stage       |
| `post {}`          | Runs after all stages — handles success/failure |

---

## 10. Pipeline Stage View

When a Pipeline job runs, Jenkins provides a **Stage View** — a visual table showing:

- Every build run (`#1`, `#2`, etc.)
- Pass/fail status of each individual stage
- Time taken per stage

This is extremely useful for debugging because you can see **exactly which stage failed** and click into it to view logs.

```
         Build    Test    Deploy
  #2      ✅       ✅       ✅       2s
  #1      ✅       ✅       ✅       6s
```

If a stage fails, Jenkins stops execution and skips all subsequent stages, preventing broken code from being deployed.

---

## 11. How Jenkins Executes Shell Commands

When Jenkins runs a shell build step or `sh` step in a pipeline, it:

1. Takes your commands and writes them to a **temporary shell script file**
2. Executes it using `/bin/sh -xe`
   - `-x` prints each command before running it (prefixed with `+`)
   - `-e` stops execution immediately if any command returns an error
3. Streams the output to the **Console Output** log in real time

This is why you see `+` before every command in the console output.

---

## 12. Workspace Persistence

Jenkins maintains a **workspace folder** per job at `/var/jenkins_home/workspace/<job-name>`. Files created in one build persist into the next build unless explicitly cleaned. This is why Build `#2` ran faster than `#1` — the `build/` folder already existed from the previous run.

---

## 13. The post Block

The `post` block in a Jenkinsfile runs **after all stages complete**, regardless of outcome. Common conditions:

| Condition  | Runs when                              |
| ---------- | -------------------------------------- |
| `success`  | All stages passed                      |
| `failure`  | Any stage failed                       |
| `always`   | Every time, no matter what             |
| `unstable` | Build is unstable (e.g. test warnings) |

---

## 14. CI/CD in the Real World

The pipeline we built simulates a real-world CI/CD flow:

```
Stage       Real World Action
─────────   ──────────────────────────────────────────
Build     → Compile source code, create JAR/Docker image
Test      → Run unit tests, integration tests, code coverage
Deploy    → Push to staging or production server
Post      → Notify team via Slack/Email, update ticket status
```

In production, each stage would contain real commands like `mvn build`, `npm test`, `docker push`, or `kubectl apply` instead of echo statements.
