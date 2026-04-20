'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "holter-allocation",
  "title": "Holter Allocation",
  "subtitle": "Device Asset Tracking \u00b7 Arrhythmia Counts \u00b7 HRV Analysis",
  "apiPath": "/diagnostic/holter-allocation",
  "regulations": [
    {
      "body": "ISHNE/HRS",
      "citation": "2017 Ambulatory ECG Guidelines",
      "requirement": "24-48hr Holter monitoring. Track PVC/PAC/VT/SVT/AF counts. HRV analysis (SDNN/RMSSD). Device cleaning log."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "deviceId",
      "label": "Device"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "patientName",
      "label": "Patient Name",
      "type": "text",
      "required": true
    },
    {
      "key": "deviceId",
      "label": "Device ID",
      "type": "text",
      "required": true
    },
    {
      "key": "recordingDurationHrs",
      "label": "Duration (hrs)",
      "type": "number"
    },
    {
      "key": "notes",
      "label": "Notes",
      "type": "textarea",
      "span": 2
    }
  ]
};

export default function Page() {{
  return <FeatureCrudPage config={{config}} />;
}}
