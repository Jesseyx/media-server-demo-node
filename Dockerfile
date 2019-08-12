FROM gcc:7

# install node
RUN curl -sL https://deb.nodesource.com/setup_11.x | bash -\
    && apt-get install -y nodejs

# Create app directory
WORKDIR /home/yaoxiao/media-server-demo

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Create ssl cert
RUN npm run openssl

# Bundle app source
COPY . .

# 10000-10050 UDP for TURN/STUN server
# 5004 5005 UDP for rtp publisher
# 8000 TCP for node server
EXPOSE 10000-10050 5004 5005 8000
CMD [ "npm", "run", "serve" ]
