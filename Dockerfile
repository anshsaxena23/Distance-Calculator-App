FROM python:3.10

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Command to run the FastAPI app using Uvicorn
# --host 0.0.0.0 is essential for Docker to expose the port
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]