FROM node:8.12
WORKDIR /app
COPY package.json /app/package.json
RUN npm install
COPY . /app
# ubuntu 添加根证书相关操作
RUN cd ~ \
  && mkdir .anyproxy \
  && cd .anyproxy \
  && mv /app/certificates ~/.anyproxy/ \
  && cp ~/.anyproxy/certificates/rootCA.crt /usr/local/share/ca-certificates/ \
  && update-ca-certificates
CMD ["node", "index.js"]
