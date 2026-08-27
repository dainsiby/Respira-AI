# RESPIRA AI — Cloud Federation Engine

## Future Responsibility

The `cloud/federation` directory will house the central Federated Learning server components built on the Flower framework.

### Core Functions & Responsibilities:
- **Flower FL Server**: Central server process coordinating distributed learning sessions across hospital nodes.
- **Federation Coordinator**: Session scheduler, round initialization, client selection, and lifecycle management.
- **FedAvg Aggregation**: Implementation of Federated Averaging (`FedAvg`) and robust weight aggregation algorithms.
- **Global Model Distribution**: Secure delivery mechanism for broadcasting aggregated global model updates to participating hospital nodes.
- **FL Round Management**: Metric tracking (loss, accuracy), client evaluation aggregation, and round convergence verification.

> [!IMPORTANT]
> The Flower server handles **only model weight updates (tensors)** and training hyperparameter metadata. Raw training data and patient images are never transmitted to or processed by the cloud federation engine.
