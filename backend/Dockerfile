# Use Node.js base image
FROM node:20

# Create app directory
WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
RUN npm install

# Expose the port (adjust if not using 4000)
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]
