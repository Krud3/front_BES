# Dockerfile

# Usa una imagen base oficial de Python
FROM python:3.13-slim

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Instala git y otras dependencias del sistema si es necesario
RUN apt-get update && apt-get install -y git && apt-get clean

# Copia los archivos del servidor al contenedor
COPY server.py process_nodes.py data_generator.py requirements.txt ./
COPY proper_dates.py to_csv.py ./

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Crea el directorio para los archivos CSV
RUN mkdir -p /app/csv && chmod -R 755 /app/csv

# Asegura que los scripts sean ejecutables
RUN chmod +x process_nodes.py data_generator.py server.py

# Expone el puerto 5000 para acceder al servidor Flask
EXPOSE 5000

# Comando para ejecutar el servidor Flask
CMD ["python", "server.py"]
