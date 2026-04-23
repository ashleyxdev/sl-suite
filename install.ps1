Write-Host "================================================"
Write-Host "        Software Lab"
Write-Host "        Lab File Downloader"
Write-Host "================================================"
Write-Host ""

# Base URL of your GitHub repo (raw content)
$repoBase = "https://raw.githubusercontent.com/ashleyxdev/sl-suite/main"

# ── Deep Learning Practicals ──────────────────────────────────
$dlPracticals = @(
    @{ id = 1; folder = "practical-1"; desc = "Vector Addition in TensorFlow";
       files = @("practical-1.ipynb", "readme.md", "setup.md", "vector-addition.py") },

    @{ id = 2; folder = "practical-2"; desc = "MLP with NumPy & PyTorch";
       files = @("setup.md", "theory.md") },

    @{ id = 3; folder = "practical-3"; desc = "CNN for Image Classification";
       files = @("setup.md", "theory.md") },

    @{ id = 4; folder = "practical-4"; desc = "RNN & LSTM Sentiment Analysis";
       files = @("setup.md", "theory.md") },

    @{ id = 5; folder = "practical-5"; desc = "DCGAN Image Generation";
       files = @("setup.md", "theory.md") },

    @{ id = 6; folder = "practical-6"; desc = "DNN Agents in Simulated Environment";
       files = @("setup.md", "theory.md") }
)

# ── DevOps Practicals ─────────────────────────────────────────
$devopsPracticals = @(
    @{ id = 1; folder = "practical-1"; desc = "User Registration with Flask and Docker";
       files = @("Dockerfile", "app.py", "requirements.txt", "templates/form.html", "templates/success.html", "theory.md") },

    @{ id = 2; folder = "practical-2"; desc = "Git and GitHub Source Code Management";
       files = @("practical.md", "theory.md") },

    @{ id = 3; folder = "practical-3"; desc = "Jenkins Installation and CI/CD Setup";
       files = @("setup.md", "theory.md") },

    @{ id = 4; folder = "practical-4"; desc = "CI/CD Pipeline with Jenkins";
       files = @("Dockerfile", "Jenkinsfile", "app.js", "fix.md", "package-lock.json", "package.json", "setup.md", "test/app.test.js", "theory.md", "views/index.ejs") },

    @{ id = 5; folder = "practical-5"; desc = "Docker Commands for Content Management";
       files = @("Dockerfile", "app.js", "docker-commands.md", "package-lock.json", "package.json", "views/index.ejs") },

    @{ id = 8; folder = "practical-8"; desc = "JavaScript Testing using Selenium";
       files = @("index.html", "package-lock.json", "package.json", "test.js") },

    @{ id = 9; folder = "practical-9"; desc = "Selenium Test Cases for Containerized App";
       files = @("Dockerfile", "app.js", "package-lock.json", "package.json", "test.js", "views/index.ejs") }
)

# ── Course Selection ──────────────────────────────────────────
Write-Host "Select a course:"
Write-Host "-----------------"
Write-Host "  1. Deep Learning"
Write-Host "  2. DevOps"
Write-Host ""
$courseChoice = Read-Host "Enter course [1, 2]"

switch ($courseChoice) {
    "1" {
        $coursePrefix = "deep-learning"
        $courseName  = "Deep Learning"
        $practicals  = $dlPracticals
    }
    "2" {
        $coursePrefix = "devops"
        $courseName  = "DevOps"
        $practicals  = $devopsPracticals
    }
    default {
        Write-Host "Invalid choice! Please enter 1 or 2."
        exit
    }
}

Write-Host ""
Write-Host "================================================"
Write-Host "  $courseName — Available Practicals"
Write-Host "================================================"
Write-Host ""

# Display practicals menu
foreach ($p in $practicals) {
    Write-Host "  $($p.id). $($p.desc)"
}

# Prompt for choice
$allIds = $practicals | ForEach-Object { $_.id }
$validIds = $allIds -join ", "
Write-Host ""
$choice = Read-Host "Enter your choice [$validIds]"

# Find the selected practical
$selected = $practicals | Where-Object { $_.id -eq [int]$choice }

if (-not $selected) {
    Write-Host "Invalid choice! Please enter one of: $validIds"
    exit
}

# Create the practical folder locally
$folder = $selected.folder
if (-not (Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder | Out-Null
}

# Download each file into the folder
Write-Host "`nDownloading $folder ($($selected.desc))..."
$failed = $false

foreach ($file in $selected.files) {
    $fileUrl = "$repoBase/$coursePrefix/$folder/$file"
    $outPath = Join-Path $folder $file

    # Create subdirectories if needed (e.g. templates/form.html → mkdir templates)
    $fileDir = Split-Path $outPath -Parent
    if ($fileDir -and -not (Test-Path $fileDir)) {
        New-Item -ItemType Directory -Path $fileDir -Force | Out-Null
    }

    try {
        Invoke-WebRequest -Uri $fileUrl -OutFile $outPath -ErrorAction Stop
    } catch {
        Write-Host "  ❌ Failed to download: $file"
        $failed = $true
    }
}

if ($failed) {
    Write-Host "`n⚠️  Some files failed to download. Check the repository link."
} else {
    Write-Host "`n✅ All files downloaded to ./$folder/"
}

Write-Host "`nDone!"