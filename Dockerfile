# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY ./package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose port 3000 for the app to listen on
EXPOSE 3000

# Set environment variables for MongoDB connection
ENV MONGO_HOST=mongodb
ENV MONGO_PORT=27017
ENV MONGO_DB=collaboardation

# Install MongoDB client
RUN apt-get update && apt-get install -y mongodb-clients

# Start MongoDB service
CMD mongod --bind_ip_all --dbpath /data/db &

# Start the app
CMD [ "npm", "start" ]
