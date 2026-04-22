#!/usr/bin/env bash

echo "================================================"
echo "        Software Lab"
echo "        Lab File Downloader"
echo "================================================"
echo ""

# Base URL of your GitHub repo (raw content)
REPO_BASE="https://raw.githubusercontent.com/ashleyxdev/sl-suite/main"

# ── Deep Learning Practicals ──────────────────────────────────
# Format: ID|FOLDER|DESCRIPTION|FILE1,FILE2,...
DL_PRACTICALS=(
    "1|practical-1|Vector Addition in TensorFlow|practical-1.ipynb,readme.md,setup.md,vector-addition.py"
    "2|practical-2|MLP with NumPy & PyTorch|setup.md,theory.md"
    "3|practical-3|CNN for Image Classification|setup.md,theory.md"
    "4|practical-4|RNN & LSTM Sentiment Analysis|setup.md,theory.md"
    "5|practical-5|DCGAN Image Generation|setup.md,theory.md"
    "6|practical-6|DNN Agents in Simulated Environment|setup.md,theory.md"
)

# ── DevOps Practicals ─────────────────────────────────────────
DEVOPS_PRACTICALS=(
    "1|practical-1|Docker Flask App|Dockerfile,app.py,requirements.txt,templates/form.html,templates/success.html,theory.md"
    "2|practical-2|DevOps Practical 2|practical.md,theory.md"
    "5|practical-5|Docker Node.js App|Dockerfile,app.js,docker-commands.md,package-lock.json,package.json,views/index.ejs"
    "8|practical-8|Node.js Testing|index.html,package-lock.json,package.json,test.js"
    "9|practical-9|Docker Node.js CI/CD|Dockerfile,app.js,package-lock.json,package.json,test.js,views/index.ejs"
)

# ── Course Selection ──────────────────────────────────────────
echo "Select a course:"
echo "-----------------"
echo "  1. Deep Learning"
echo "  2. DevOps"
echo ""
read -rp "Enter course [1, 2]: " COURSE_CHOICE

case "$COURSE_CHOICE" in
    1)
        COURSE_PREFIX="deep-learning"
        COURSE_NAME="Deep Learning"
        PRACTICALS=("${DL_PRACTICALS[@]}")
        ;;
    2)
        COURSE_PREFIX="devops"
        COURSE_NAME="DevOps"
        PRACTICALS=("${DEVOPS_PRACTICALS[@]}")
        ;;
    *)
        echo "Invalid choice! Please enter 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "  $COURSE_NAME — Available Practicals"
echo "================================================"
echo ""

# Display practicals menu
for entry in "${PRACTICALS[@]}"; do
    IFS='|' read -r id folder desc files <<< "$entry"
    echo "  $id. $desc"
done

# Build valid IDs string
VALID_IDS=""
for entry in "${PRACTICALS[@]}"; do
    IFS='|' read -r id _ _ _ <<< "$entry"
    if [ -n "$VALID_IDS" ]; then
        VALID_IDS="$VALID_IDS, $id"
    else
        VALID_IDS="$id"
    fi
done

echo ""
read -rp "Enter your choice [$VALID_IDS]: " CHOICE

# Find the selected practical
SELECTED=""
for entry in "${PRACTICALS[@]}"; do
    IFS='|' read -r id folder desc files <<< "$entry"
    if [[ "$id" == "$CHOICE" ]]; then
        SELECTED="$entry"
        break
    fi
done

if [ -z "$SELECTED" ]; then
    echo "Invalid choice! Please enter one of: $VALID_IDS"
    exit 1
fi

# Parse selected entry
IFS='|' read -r _ SEL_FOLDER SEL_DESC SEL_FILES <<< "$SELECTED"

# Create the practical folder locally
mkdir -p "$SEL_FOLDER"

echo ""
echo "Downloading $SEL_FOLDER ($SEL_DESC)..."

FAILED=0

# Download each file
IFS=',' read -ra FILE_ARRAY <<< "$SEL_FILES"
for file in "${FILE_ARRAY[@]}"; do
    FILE_URL="$REPO_BASE/$COURSE_PREFIX/$SEL_FOLDER/$file"
    OUT_PATH="$SEL_FOLDER/$file"

    # Create subdirectories if needed (e.g. templates/form.html → mkdir templates)
    FILE_DIR=$(dirname "$OUT_PATH")
    if [ "$FILE_DIR" != "$SEL_FOLDER" ]; then
        mkdir -p "$FILE_DIR"
    fi

    if curl -fsSL "$FILE_URL" -o "$OUT_PATH"; then
        :
    else
        echo "  ❌ Failed to download: $file"
        FAILED=1
    fi
done

if [ "$FAILED" -eq 1 ]; then
    echo ""
    echo "⚠️  Some files failed to download. Check the repository link."
else
    echo ""
    echo "✅ All files downloaded to ./$SEL_FOLDER/"
fi

echo ""
echo "Done!"