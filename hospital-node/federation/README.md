# RESPIRA AI — Hospital Node FL Client

## Future Responsibility

The `hospital-node/federation` directory will contain the Flower Federated Learning Client executing privacy-preserving collaborative model updates.

### Planned Components & Responsibilities:
- **Cloud Coordinator Connection**: Secure gRPC / TLS client connection to the central RESPIRA AI Cloud FL Coordinator.
- **Global Model Receipt**: Reception of global model weight updates at the start of each federated round.
- **Local Training Execution**: Execution of local training epochs on local dataset tensors using local compute resources.
- **Weight Update Calculation**: Computation of model parameter gradients / weight diffs following local training.
- **Model Update Transmission**: Transmission of updated numerical model parameters (weight matrices) back to the FL Coordinator.
- **Training Metrics Reporting**: Reporting of aggregated local training loss, accuracy, and sample counts.

> [!IMPORTANT]
> **Strict Privacy Guarantee**: The FL client transmits **only model parameter weights and scalar metrics**. Raw patient records, clinical data, and X-ray images **never** leave the hospital node boundary.
