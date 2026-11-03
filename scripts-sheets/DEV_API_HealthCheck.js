function devApiHealthCheck() {
    return {
      status: "OK",
      environment: "DEV",
      service: "FacIntake_Sync_SAFE",
      message: "n8n to Apps Script connection successful"
    };
  }
  