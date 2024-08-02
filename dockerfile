# Use the official Node.js image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the project files to the working directory
COPY . .

# Define Port Env Variable as Port 7654
ENV PORT=7654

# Expose the port the app runs on
EXPOSE 7654

# Start the application
CMD ["npm", "start"]