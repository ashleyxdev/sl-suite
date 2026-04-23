# Jenkins CI/CD — Setup & Practical Guide

## Prerequisites

- Windows with **WSL Ubuntu** installed
- **Docker Desktop** installed and running
- A browser (Chrome / Edge / Firefox)

---

## Part 1: Running Jenkins with Docker

### Step 1: Verify Docker is working

Open your WSL Ubuntu terminal and run:

```bash
docker --version
```

Expected output:

```
Docker version 29.x.x, build xxxxxxx
```

Then verify Docker is running:

```bash
docker ps
```

Expected output (empty table is fine — means no containers running yet):

```
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

If you get a connection error, open **Docker Desktop** on Windows first, then retry.

---

### Step 2: Start the Jenkins Container

Run the following command in your WSL terminal:

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

**What each flag does:**

| Flag                                | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `-d`                                | Run container in background (detached)     |
| `--name jenkins`                    | Name the container "jenkins"               |
| `-p 8080:8080`                      | Map your PC's port 8080 to Jenkins UI port |
| `-p 50000:50000`                    | Port for Jenkins agents to connect         |
| `-v jenkins_home:/var/jenkins_home` | Persist Jenkins data across restarts       |
| `jenkins/jenkins:lts`               | Use the official stable Jenkins image      |

Docker will download the image (first time only) and start the container.

---

### Step 3: Verify Jenkins is Running

```bash
docker ps
```

You should see the jenkins container with status **Up**:

```
CONTAINER ID   IMAGE                 ...   STATUS         PORTS                     NAMES
d1a3d981ecdc   jenkins/jenkins:lts   ...   Up 8 seconds   0.0.0.0:8080->8080/tcp    jenkins
```

---

### Step 4: Get the Initial Admin Password

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Copy the output (a long alphanumeric string). You will need it to unlock Jenkins.

---

### Step 5: Open Jenkins in Browser

Navigate to:

```
http://localhost:8080
```

1. Paste the admin password into the **Unlock Jenkins** screen
2. Click **Install suggested plugins** and wait for installation
3. Create your **admin username and password**
4. Click **Save and Finish** → **Start using Jenkins**

You are now on the **Jenkins Dashboard**.

---

## Part 2: Creating a Freestyle Job

### Step 1: Create New Item

1. Click **+ New Item** in the left sidebar
2. Enter name: `my-first-job`
3. Select **Freestyle project**
4. Click **OK**

---

### Step 2: Configure the Job

On the configuration page:

1. In the **Description** field, enter:

   ```
   My first Jenkins job - prints Hello World
   ```

2. Scroll down to **Build Steps**
3. Click **Add build step** → Select **Execute shell**
4. In the shell text box, enter:

```bash
echo "Hello from Jenkins!"
echo "Current date and time:"
date
echo "Build number: $BUILD_NUMBER"
```

5. Click **Save**

---

### Step 3: Run the Job

1. Click **Build Now** in the left sidebar
2. A build appears in the **Builds** section at the bottom
3. Click on **#1** → Click **Console Output**

Expected output:

```
Started by user <your name>
Running as SYSTEM
Building in workspace /var/jenkins_home/workspace/my-first-job
[my-first-job] $ /bin/sh -xe /tmp/jenkins<random>.sh
+ echo Hello from Jenkins!
Hello from Jenkins!
+ echo Current date and time:
Current date and time:
+ date
Wed Apr 22 23:46:25 UTC 2026
+ echo Build number: 1
Build number: 1
Finished: SUCCESS
```

---

## Part 3: Creating a Pipeline Job

### Step 1: Create New Item

1. Click **Jenkins** in the top left to go back to Dashboard
2. Click **+ New Item**
3. Enter name: `my-first-pipeline`
4. Select **Pipeline**
5. Click **OK**

---

### Step 2: Configure the Pipeline

1. In the **Description** field, enter:

   ```
   My first Jenkins Pipeline - Build, Test, Deploy stages
   ```

2. Scroll down to the **Pipeline** section
3. Make sure **Definition** is set to **Pipeline script**
4. Paste the following Jenkinsfile into the **Script** text area:

```groovy
pipeline {
    agent any

    stages {

        stage('Build') {
            steps {
                echo '🔨 Building the application...'
                echo "Build number: ${env.BUILD_NUMBER}"
                sh 'mkdir -p build && echo "app-v1.0" > build/output.txt'
                echo '✅ Build complete!'
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                sh 'cat build/output.txt'
                sh 'echo "All tests passed!" > build/test-results.txt'
                echo '✅ Tests passed!'
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying application...'
                sh 'cat build/test-results.txt'
                echo "✅ App deployed successfully on build ${env.BUILD_NUMBER}!"
            }
        }

    }

    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check the logs.'
        }
    }
}
```

5. Click **Save**

---

### Step 3: Run the Pipeline

1. Click **Build Now**
2. Watch the **Stage View** appear on the job page showing each stage
3. Click on **#1** → **Console Output** to see detailed logs

Expected console output (summarised):

```
[Pipeline] Start of Pipeline
[Pipeline] node
Running on Jenkins in /var/jenkins_home/workspace/my-first-pipeline
[Pipeline] { (Build)
+ mkdir -p build
+ echo app-v1.0
✅ Build complete!
[Pipeline] { (Test)
+ cat build/output.txt
app-v1.0
✅ Tests passed!
[Pipeline] { (Deploy)
+ cat build/test-results.txt
All tests passed!
✅ App deployed successfully on build 1!
[Pipeline] { (Declarative: Post Actions)
🎉 Pipeline completed successfully!
Finished: SUCCESS
```

---

### Step 4: View the Stage View

Go back to the **my-first-pipeline** job page. You will see:

```
         Build    Test    Deploy
  #1      ✅       ✅       ✅       6s
```

Run the job a second time (**Build Now** again) and notice:

```
         Build    Test    Deploy
  #2      ✅       ✅       ✅       2s   ← faster, workspace already exists
  #1      ✅       ✅       ✅       6s
```

---

## Part 4: Stopping and Restarting Jenkins

### Stop the container:

```bash
docker stop jenkins
```

### Start it again:

```bash
docker start jenkins
```

### Remove the container completely:

```bash
docker rm -f jenkins
```

> Note: Your Jenkins data (jobs, builds, config) is safe in the `jenkins_home` Docker volume even if the container is removed.

### View saved volumes:

```bash
docker volume ls
```

---

## Quick Reference

| Task                 | Command / Action                                                         |
| -------------------- | ------------------------------------------------------------------------ |
| Start Jenkins        | `docker start jenkins`                                                   |
| Stop Jenkins         | `docker stop jenkins`                                                    |
| View logs            | `docker logs jenkins`                                                    |
| Open Jenkins UI      | `http://localhost:8080`                                                  |
| Get admin password   | `docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword` |
| Create a job         | Dashboard → New Item                                                     |
| Run a job            | Job page → Build Now                                                     |
| View build logs      | Build → Console Output                                                   |
| View stage breakdown | Pipeline job page → Stage View                                           |
