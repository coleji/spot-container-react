FROM nginx:latest
RUN ls -las
COPY ./dist /usr/share/nginx/html/
COPY ./nginx-docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD cd /usr/share/nginx/html && \
nginx -g 'daemon off;'
