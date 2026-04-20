'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "wmda-sync",
  "title": "WMDA Sync",
  "subtitle": "Donor Search \u00b7 HLA Matching \u00b7 Workup \u00b7 Transplant",
  "apiPath": "/diagnostic/wmda-sync",
  "regulations": [
    {
      "body": "WMDA",
      "citation": "Donor Registry Standards",
      "requirement": "HLA matching (A/B/C/DRB1/DQB1). Donor search \u2192 match \u2192 workup \u2192 collection \u2192 transplant."
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
      "key": "searchStatus",
      "label": "Search Status"
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
      "key": "diagnosis",
      "label": "Diagnosis",
      "type": "text"
    },
    {
      "key": "urgency",
      "label": "Urgency",
      "type": "select",
      "options": [
        "routine",
        "urgent",
        "emergency"
      ]
    },
    {
      "key": "hlaA",
      "label": "HLA-A",
      "type": "text"
    },
    {
      "key": "hlaB",
      "label": "HLA-B",
      "type": "text"
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
