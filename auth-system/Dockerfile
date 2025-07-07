# Use official Node.js image
FROM node:18

# Install Python, pip, and ffmpeg
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    apt-get clean

# Create app directory
WORKDIR /app

# Copy Node app files
COPY package*.json ./
RUN npm install

# Copy all app files
COPY . .

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Use production port
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start your app
CMD ["node", "server/server.js"]
