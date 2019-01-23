FROM node:9.8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
RUN npx webpack

EXPOSE 8000
CMD "node" "index.js"