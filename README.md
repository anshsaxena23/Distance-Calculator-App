# Distance-Calculator-App
Distance-Calculator-App

This is a full-stack, containerized web application designed to calculate the distance between two addresses and store the query history per user.

The stack includes:
* **Frontend:** React (served by Nginx)
* **Backend:** Python 3.10 / FastAPI
* **Database:** SQLite (using SQLAlchemy ORM)
* **Deployment:** Docker and Docker Compose
  
Step 1 - Download / Clone the repository in a folder.

  **Clone the Repository:**
    
    git clone https://github.com/anshsaxena23/Distance-Calculator-App 
    
    cd Distance-Calculator-App

Step 2 - **[Docker](https://www.docker.com/products/docker-desktop)**: Includes Docker Engine and Docker Compose.

Step 3 - **Build and Run the Containers:**
    This command reads the `docker-compose.yaml` file, builds the `app` (FastAPI) and `nginx` services, sets up the network, and starts everything in detached mode (`-d`).
    ```bash
    docker compose up --build -d
    ```

Step 4 - **Access the Application:**
    Once the containers are running (this may take a minute for the first build), you can access the application:
    * **Web App (Frontend):** `http://localhost:3000`
    * **Direct API Documentation (FastAPI):** `http://localhost:8000/api/docs` (For testing and viewing available endpoints)

## Stopping and Cleaning Up

To stop and remove all services, networks, and volumes created by Docker Compose:

```bash
docker compose down --volumes
