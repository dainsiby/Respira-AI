# RESPIRA AI — Local Model Lifecycle Manager

## Future Responsibility

The `hospital-node/model_manager` directory will manage the local storage, versioning, verification, and active deployment of AI model weights.

### Planned Components & Responsibilities:
- **Model Version Tracking**: Registry of all local model checkpoints and downloaded global model versions.
- **Global Model Weight Storage**: Secure local directory storing verified global weights received from cloud FL rounds.
- **Locally Trained Model Storage**: Local repository for checkpoints produced during local training sessions.
- **Active Model Selection**: Hot-swapping mechanism for selecting and activating the active inference model without restarting services.
- **Model Validation**: Automated validation suite testing model loading and sample inference performance before activation.
- **SHA-256 Checksum Verification**: Cryptographic verification ensuring downloaded weights are untampered and uncorrupted.
- **Safe Model Replacement**: Atomic file replacement preventing partial file writes or corruption during model updates.
- **Rollback Mechanism**: Immediate automated rollback to the previous known-good model version if validation fails.

> [!NOTE]
> Ensures local clinical inference always runs on verified, high-performance, untampered model weights.
