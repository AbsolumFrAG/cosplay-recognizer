FROM node:22

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN mkdir -p dataset models

EXPOSE 3000

CMD ["npm", "start"]