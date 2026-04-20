'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "endoscopy-center",
  "title": "Endoscopy Center",
  "subtitle": "OGD \u00b7 Colonoscopy \u00b7 ERCP \u00b7 Bronchoscopy \u00b7 Biopsy Tracking",
  "apiPath": "/diagnostic/endoscopy-center",
  "regulations": [
    {
      "body": "SGNA/ESGE",
      "citation": "Scope Reprocessing Guidelines, ASA Sedation",
      "requirement": "Scope reprocessing per SGNA/ESGE. Sedation monitoring per ASA. Biopsy specimen chain of custody."
    }
  ],
  "columns": [
    {
      "key": "procedureDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "procedureType",
      "label": "Procedure"
    },
    {
      "key": "endoscopist",
      "label": "Endoscopist"
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
      "key": "procedureType",
      "label": "Procedure",
      "type": "select",
      "required": true,
      "options": [
        "ogd",
        "colonoscopy",
        "sigmoidoscopy",
        "eus",
        "ercp",
        "bronchoscopy",
        "cystoscopy"
      ]
    },
    {
      "key": "indication",
      "label": "Indication",
      "type": "text"
    },
    {
      "key": "biopsyTaken",
      "label": "Biopsy Taken",
      "type": "checkbox"
    },
    {
      "key": "scopeReprocessed",
      "label": "Scope Reprocessed",
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
