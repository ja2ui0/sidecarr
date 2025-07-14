FROM nginx:alpine

# Copy site files (immutable app code)
COPY ./site/ /usr/share/nginx/html/

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Mount point for user config + icons
COPY config/ /config/
VOLUME /config

# Expose web port
EXPOSE 80

