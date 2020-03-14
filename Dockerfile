FROM node:10.16.3
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --only=prod
COPY . /app
# ubuntu 添加根证书相关操作
RUN cd ~ \
  && mkdir .anyproxy \
  && cd .anyproxy \
  && mv /app/certificates ~/.anyproxy/ \
  && cp ~/.anyproxy/certificates/rootCA.crt /usr/local/share/ca-certificates/ \
  && update-ca-certificates
# 修改时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
EXPOSE 8101 8104
CMD ["node", "index.js"]
