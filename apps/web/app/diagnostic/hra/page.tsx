'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "hra",
  "title": "Health Risk Assessment",
  "subtitle": "NCD Screening \u00b7 BMI \u00b7 Risk Score \u00b7 Labour Code 2020",
  "apiPath": "/diagnostic/hra",
  "regulations": [
    {
      "body": "MoLE",
      "citation": "Occupational Safety Code 2020",
      "requirement": "Mandatory annual checkup for employees 40+. NCD screening: HTN, diabetes, CVD. Auto BMI calculation."
    }
  ],
  "columns": [
    {
      "key": "assessmentDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "overallRiskLevel",
      "label": "Risk Level"
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
      "key": "patientAge",
      "label": "Age",
      "type": "number"
    },
    {
      "key": "heightCm",
      "label": "Height (cm)",
      "type": "number"
    },
    {
      "key": "weightKg",
      "label": "Weight (kg)",
      "type": "number"
    },
    {
      "key": "systolicBp",
      "label": "Systolic BP",
      "type": "number"
    },
    {
      "key": "fastingGlucose",
      "label": "Fasting Glucose",
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
