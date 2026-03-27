# 第一階段：建置 (Build)
# 使用 Node.js 把 React 程式碼編譯成靜態檔案 (HTML/CSS/JS)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 第二階段：執行 (Production)
# 使用 Nginx 來伺服這些靜態檔案 (輕量、快速)
FROM nginx:alpine
# 把第一階段編譯好的檔案 (/app/dist) 複製到 Nginx 的網頁目錄
COPY --from=build /app/dist /usr/share/nginx/html
# 開放 80 Port
EXPOSE 80
# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]