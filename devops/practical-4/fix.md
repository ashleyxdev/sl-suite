If the permission error occurs, here are the fixes in order of preference:

---

## Fix 1 — Quick Fix (Temporary)
Sets permission directly on the socket inside the running container:

```bash
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

> ⚠️ This resets every time the container restarts. Good for quick testing.

---

## Fix 2 — Permanent Fix (Recreate with correct group)

Find the Docker socket group ID on your host:
```bash
stat -c '%g' /var/run/docker.sock
```

Then recreate Jenkins with that group explicitly added:
```bash
docker stop jenkins && docker rm jenkins

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

> This is what we already did — if `docker exec jenkins docker ps` works, you don't need any fix at all!

---

## How to know which fix you need:

```
docker exec jenkins docker ps
        |
        ├── Shows table  ──► ✅ No fix needed, proceed to Build Now
        |
        └── Permission denied ──► Apply Fix 1 first
                                  If it persists → Apply Fix 2
```

---

Run the check and let me know what happens! 🚀
