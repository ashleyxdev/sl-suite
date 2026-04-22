# Demonstrating Docker Commands

Now we use this app to demonstrate **every important Docker command.** Each command has a clear purpose here — nothing is run blindly.

---

## 🔨 1. Build the Image

```bash
docker build -t content-manager:v1 .
```

```
-t content-manager:v1   → tag the image with name:version
.                        → build context is current directory
```

---

## 📋 2. List Images

```bash
docker images
```

Output:
```
REPOSITORY         TAG    IMAGE ID       SIZE
content-manager    v1     a1b2c3d4e5f6   145MB
python             3.11-slim  ...        125MB
```

You can see your image and its base image.

---

## 📦 3. Create a Volume (for persistent data)

```bash
docker volume create cms-data
```

```
Without volume:   posts.json lives INSIDE container
                  container deleted → data lost ❌

With volume:      posts.json lives on HOST machine
                  container deleted → data safe ✅
                  new container → same data ✅
```

---

## ▶️ 4. Run the Container

```bash
docker run -d \
  --name cms \
  -p 5000:5000 \
  -v cms-data:/data \
  content-manager:v1
```

```
-d                  → detached (runs in background)
--name cms          → give it a name
-p 5000:5000        → port mapping
-v cms-data:/data   → mount volume at /data inside container
```

Open **http://localhost:5000** and add a few posts.

---

## 📊 5. List Running Containers

```bash
docker ps
```

Output:
```
CONTAINER ID   IMAGE                COMMAND           STATUS         PORTS
a1b2c3d4e5f6   content-manager:v1   "python app.py"   Up 2 minutes   0.0.0.0:5000->5000/tcp
```

```bash
docker ps -a    # shows ALL containers including stopped ones
```

---

## 📜 6. View Logs

```bash
docker logs cms
```

Output:
```
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
127.0.0.1 - - [22/Apr/2026 10:30:00] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [22/Apr/2026 10:30:12] "POST /add HTTP/1.1" 302 -
```

```bash
docker logs -f cms    # -f = follow (live streaming logs)
```

---

## 🔧 7. Execute Commands Inside Container

```bash
# Open an interactive shell inside the running container
docker exec -it cms bash

# Now you're INSIDE the container:
ls /app          # see your project files
ls /data         # see posts.json
cat /data/posts.json   # read the actual data
exit             # exit container shell
```

```bash
# Run a single command without entering shell
docker exec cms cat /data/posts.json
```

---

## 🔍 8. Inspect Container Details

```bash
docker inspect cms
```

This dumps a JSON object with everything about the container:

```json
{
  "Id": "a1b2c3...",
  "Name": "/cms",
  "State": { "Status": "running" },
  "Mounts": [
    {
      "Type": "volume",
      "Name": "cms-data",
      "Source": "/var/lib/docker/volumes/cms-data/_data",
      "Destination": "/data"
    }
  ],
  "NetworkSettings": {
    "IPAddress": "172.17.0.2",
    "Ports": { "5000/tcp": [{ "HostPort": "5000" }] }
  }
}
```

Useful for debugging networking and volume issues.

---

## 📈 9. Live Resource Stats

```bash
docker stats cms
```

Output (live updating):
```
CONTAINER   CPU %   MEM USAGE / LIMIT   MEM %   NET I/O
cms         0.1%    28MiB / 8GiB        0.3%    1.2kB / 800B
```

Like `htop` but for containers. Press `Ctrl+C` to exit.

---

## 📁 10. Copy Files To/From Container

```bash
# Copy a file FROM container to your machine
docker cp cms:/data/posts.json ./posts-backup.json

# Copy a file FROM your machine TO container
docker cp ./posts-backup.json cms:/data/posts-restored.json
```

This is useful for **backups and debugging** without entering the container.

---

## ⏸️ 11. Stop and Start

```bash
docker stop cms     # gracefully stop (sends SIGTERM, waits)
docker start cms    # start it back up
docker restart cms  # stop + start in one command
```

**Test volume persistence:**
```bash
docker stop cms
docker rm cms       # delete the container entirely

# Run a brand new container with the same volume
docker run -d \
  --name cms-new \
  -p 5000:5000 \
  -v cms-data:/data \
  content-manager:v1
```

Open http://localhost:5000 — **your posts are still there.** The data lived in the volume, not the container. ✅

---

## 🏷️ 12. Tag an Image

```bash
# Tag as v2 (simulating a new version)
docker tag content-manager:v1 content-manager:v2

# Tag for pushing to Docker Hub
docker tag content-manager:v1 yourusername/content-manager:latest

docker images   # you'll see all three tags now
```

---

## 🗑️ 13. Remove Images and Containers

```bash
docker stop cms-new
docker rm cms-new              # remove container
docker rmi content-manager:v2  # remove image

# Cannot remove an image that a running container is using ← try it, see the error
```

---

## 🧹 14. System Prune (Cleanup)

```bash
docker system prune
```

Removes:
- All stopped containers
- All unused networks
- All dangling images (untagged)
- Build cache

```bash
docker system prune -a   # also removes unused images (more aggressive)
```

---

## 📦 15. Volume Commands

```bash
docker volume ls                    # list all volumes
docker volume inspect cms-data      # details about a volume
docker volume rm cms-data           # delete a volume (container must be stopped)
```

---

# 🔍 Part 6: Understand — The Big Picture

## Container vs Volume lifecycle

```
Container (cms)         Volume (cms-data)
───────────────         ─────────────────
Created  ──────────┐    Created independently
Running            │    Mounted into container at /data
Stopped            │    Data written here persists
Deleted ───────────┘    Volume still exists ✅
                        
New container ──────────Mount same volume
Running                 Sees all old data ✅
```

## The `docker exec` mental model

```
docker exec -it cms bash

-it = interactive + TTY (gives you a terminal)
cms = container name
bash = command to run inside
```

It's like SSH-ing into the container. The container keeps running — you're just opening a shell session inside it.

---

# ✅ Summary — All Commands at a Glance

```
Image Commands:
  docker build -t name:tag .     → Build image
  docker images                  → List images
  docker tag src dest            → Tag image
  docker rmi image               → Delete image

Container Commands:
  docker run -d -p -v --name     → Create & start container
  docker ps / ps -a              → List containers
  docker stop / start / restart  → Control container
  docker rm container            → Delete container

Inspection Commands:
  docker logs -f container       → View logs
  docker exec -it container bash → Shell into container
  docker inspect container       → Full details (JSON)
  docker stats container         → Live resource usage

Data Commands:
  docker volume create name      → Create volume
  docker volume ls               → List volumes
  docker cp src dest             → Copy files in/out

Cleanup:
  docker system prune            → Clean unused resources
```

---
