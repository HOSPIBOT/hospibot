'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "abpm-reports",
  "title": "ABPM Reports",
  "subtitle": "Ambulatory BP \u00b7 Dipping Classification \u00b7 BP Phenotype",
  "apiPath": "/diagnostic/abpm-reports",
  "regulations": [
    {
      "body": "ESH",
      "citation": "2024 ABPM Guidelines",
      "requirement": "Auto dipping classification (dipper/non-dipper/reverse/extreme). BP phenotype (sustained/white-coat/masked/normal). ESH thresholds."
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
      "key": "dippingStatus",
      "label": "Dipping"
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
      "key": "systolicDay",
      "label": "Day Systolic",
      "type": "number"
    },
    {
      "key": "diastolicDay",
      "label": "Day Diastolic",
      "type": "number"
    },
    {
      "key": "systolicNight",
      "label": "Night Systolic",
      "type": "number"
    },
    {
      "key": "diastolicNight",
      "label": "Night Diastolic",
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
