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

# Start the app
CMD [ "npm", "start" ]


# docker-compose up --build (for running multiple containers and building them)
# docker build -t mynode (for building a single container caled mynode)

# sudo ssh -i BlissInstance.pem ubuntu@3.22.98.111
#minikube start --driver=docker

#sudo scp -i BlissInstance.pem  /mnt/c/Users/Akram/Downloads/github/Collaboardation/* ubuntu@3.22.98.111:~