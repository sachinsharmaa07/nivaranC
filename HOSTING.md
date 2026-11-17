# Nivaran — EC2 Hosting Guide

Complete guide to host the Nivaran application on an AWS EC2 instance using Docker.

---

## Prerequisites
- AWS account
- Docker Hub account (images at `sachinsharmaa07/nivaran-backend` and `sachinsharmaa07/nivaran-frontend`)
- A `.pem` key pair for SSH access

---

## 1. Launch an EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Settings:
   - **Name:** `nivaran-demo`
   - **AMI:** Ubuntu 24.04 LTS
   - **Instance type:** `t2.small` (2 GB RAM) or `t2.micro` (free tier, 1 GB — tight for Docker)
   - **Key pair:** Create or select an existing `.pem` key
   - **Storage:** 20 GB gp3

3. Under **Network settings**, create a security group with these inbound rules:

   | Type       | Port | Source          |
   |------------|------|-----------------|
   | SSH        | 22   | My IP           |
   | HTTP       | 80   | 0.0.0.0/0       |
   | Custom TCP | 5173 | 0.0.0.0/0       |
   | Custom TCP | 5000 | 0.0.0.0/0       |

4. Click **Launch Instance** and wait for it to start.
5. Note the **Public IPv4 address** from the instance details page.

---

## 2. SSH into the Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

Replace `<EC2-PUBLIC-IP>` with your instance's public IP.

---

## 3. Install Docker and Docker Compose

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu
newgrp docker
```

Verify installation:

```bash
docker --version
docker compose version
```

---

## 4. Create Project Directory

```bash
mkdir ~/nivaran && cd ~/nivaran
```

---

## 5. Create docker-compose.yml

```bash
nano docker-compose.yml
```

Paste the following:

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    container_name: nivaran-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: nivaran

  backend:
    image: sachinsharmaa07/nivaran-backend:latest
    container_name: nivaran-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    depends_on:
      - mongo
    env_file:
      - .env

  frontend:
    image: sachinsharmaa07/nivaran-frontend:latest
    container_name: nivaran-frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongo-data:
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

---

## 6. Create the .env File

```bash
nano .env
```

Paste and fill in your values:

```env
MONGO_URI=mongodb://mongo:27017/nivaran
PORT=5000
JWT_SECRET=<generate-a-strong-random-string>
CLIENT_URL=http://<EC2-PUBLIC-IP>:5173
VITE_API_URL=http://<EC2-PUBLIC-IP>:5000
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
EMAIL_USER=<your-email>
EMAIL_PASS=<your-app-password>
```

Replace all `<...>` placeholders with real values. Save the file.

---

## 7. Pull Images and Start

```bash
docker compose pull
docker compose up -d
```

Check that all three containers are running:

```bash
docker compose ps
```

Expected output:

```
NAME               IMAGE                                    STATUS
nivaran-mongo      mongo:7                                  Up
nivaran-backend    sachinsharmaa07/nivaran-backend:latest    Up
nivaran-frontend   sachinsharmaa07/nivaran-frontend:latest   Up
```

---

## 8. Seed the Database (First Time Only)

```bash
docker compose exec backend node seed.js
```

---

## 9. Access the Application

Open in your browser:

| Service      | URL                              |
|--------------|----------------------------------|
| Frontend     | `http://<EC2-PUBLIC-IP>:5173`     |
| Backend API  | `http://<EC2-PUBLIC-IP>:5000`     |

---

## 10. Updating to Latest Version

When new images are pushed to Docker Hub via the CI/CD pipeline:

```bash
cd ~/nivaran
docker compose pull
docker compose up -d
```

This pulls the latest images and restarts only the changed containers.

---

## Useful Commands

```bash
# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Stop all containers
docker compose down

# Stop and remove all data (database included)
docker compose down -v

# Restart a single service
docker compose restart backend

# Enter a container shell
docker compose exec backend sh
```

---

## Tips

- **Elastic IP:** Attach an Elastic IP to your instance so the public IP stays the same after restarts. Free while the instance is running.
- **Stop when not using:** Stop the EC2 instance from the AWS console when not demoing to avoid charges.
- **t2.micro** is free tier eligible (750 hrs/month for first 12 months).
- **t2.small** costs approximately 17 USD per month if left running.

