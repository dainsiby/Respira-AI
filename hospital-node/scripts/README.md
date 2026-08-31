# RESPIRA AI — Hospital Node Operational Scripts

## Future Responsibility

The `hospital-node/scripts` directory will contain automation, execution, maintenance, and daemon scripts for running local hospital node services.

### Planned Scripts:
- **`start_node.py` / `start_node.bat`**: Startup script launching local backend, frontend, and background daemons.
- **`stop_node.py` / `stop_node.bat`**: Graceful shutdown script terminating local node processes cleanly.
- **`health_check.py`**: Diagnostic script verifying database connection, AI engine readiness, and storage space.
- **`heartbeat_daemon.py`**: Background service sending periodic ping signals and status telemetry to the cloud registry.
- **`model_updater.py`**: Daemon checking for approved global model releases and initiating background downloads.
- **`backup_local_db.py`**: Automated local PostgreSQL backup utility for clinical resilience.
- **`recovery.py`**: Restoration script recovering node state from backup in case of hardware or power failure.

> [!NOTE]
> Operational scripts will support single-click execution for hospital IT administrators.
