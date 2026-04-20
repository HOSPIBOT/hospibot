'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "immunotherapy",
  "title": "Immunotherapy",
  "subtitle": "SCIT/SLIT \u00b7 Build-Up \u2192 Maintenance \u00b7 30min Observation",
  "apiPath": "/diagnostic/immunotherapy",
  "regulations": [
    {
      "body": "BSACI/AAOA",
      "citation": "SCIT/SLIT Protocols",
      "requirement": "SCIT: build-up \u2192 maintenance (3-5yr). 30-min observation mandatory. Anaphylaxis risk ~5%."
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
      "key": "therapyType",
      "label": "Type"
    },
    {
      "key": "currentPhase",
      "label": "Phase"
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
      "key": "therapyType",
      "label": "Type",
      "type": "select",
      "required": true,
      "options": [
        "scit",
        "slit-drops",
        "slit-tablet"
      ]
    },
    {
      "key": "allergenExtract",
      "label": "Allergen Extract",
      "type": "text"
    },
    {
      "key": "emergencyKitAvailable",
      "label": "Emergency Kit",
      "type": "checkbox"
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
