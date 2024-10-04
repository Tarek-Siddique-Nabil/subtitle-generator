FROM ubuntu

# Set working directory
WORKDIR /usr/local/src

# Install necessary packages
RUN apt update && apt install -y \
    bash git make vim wget g++ ffmpeg

# Clone the whisper.cpp repository, using depth 1 for a shallow clone
RUN git clone https://github.com/ggerganov/whisper.cpp.git -b v1.4.0 --depth 1

# Set working directory for whisper.cpp
WORKDIR /usr/local/src/whisper.cpp

# Download the medium.en model using the provided script
RUN bash ./models/download-ggml-model.sh medium.en

# Quantize the medium.en model
RUN make quantize && \
    ./quantize models/ggml-medium.en.bin models/ggml-medium.en-q5_0.bin q5_0

# Clean previous build artifacts
RUN make clean

# Build whisper.cpp for CPU (no cuBLAS as there is no NVIDIA GPU)
RUN make -j

# Remove the ADD command if 'cmd' is not needed
# ADD cmd /usr/local/bin/cmd

# Set default entrypoint to bash
ENTRYPOINT ["bash"]
