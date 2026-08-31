# RESPIRA AI — Local AI Engine

## Future Responsibility

The `hospital-node/ai` directory will contain the PyTorch-based medical imaging machine learning pipeline and explainability algorithms.

### Planned Components & Algorithms:
- **PyTorch Core**: Machine learning framework for local model initialization, evaluation, and fine-tuning.
- **ResNet-50 Classifier**: Deep convolutional neural network architecture optimized for binary/multiclass pneumonia detection from chest X-rays.
- **Pneumonia Classification**: High-accuracy diagnostic scoring for normal vs. pneumonia (bacterial/viral) findings.
- **Inference Engine**: Fast local prediction pipeline processing uploaded X-ray image tensors.
- **Prediction Probabilities**: Calibrated probability outputs and clinical confidence scoring.
- **Grad-CAM Explainability**: Gradient-weighted Class Activation Mapping generating visual heatmaps highlighting affected lung areas.
- **Model Loader**: Dynamic loader for loading local `.pt` / `.pth` model weights into memory.
- **Execution Target**: Auto-detects local hardware capabilities (NVIDIA GPU via CUDA or CPU fallback) for inference.

> [!IMPORTANT]
> All AI execution takes place entirely within the local hospital infrastructure. No image data is sent to cloud servers for inference.
