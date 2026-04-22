FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json .
RUN npm install

# Copy rest of the project
COPY . .

# Data directory for volume mount
RUN mkdir -p /data

EXPOSE 5000

CMD ["node", "app.js"]
