FROM node:20-alpine

# Install NGINX
RUN apk add --no-cache nginx

# Create required NGINX directories
RUN mkdir -p /usr/share/nginx/html /run/nginx /config

# Copy static site files (existing app)
COPY site/ /usr/share/nginx/html/

# Copy nginx config
COPY includes/nginx.conf /etc/nginx/nginx.conf

# Optional: pre-fill config folder if needed
COPY config/ /config/
VOLUME /config

# Expose web port
EXPOSE 80

# Start NGINX only (no Node backend yet)
CMD ["nginx", "-g", "daemon off;"]

