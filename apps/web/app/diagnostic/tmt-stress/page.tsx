'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "tmt-stress",
  "title": "TMT / Stress Test",
  "subtitle": "Bruce Protocol \u00b7 METs \u00b7 Target HR \u00b7 ST-Segment \u00b7 Duke Score",
  "apiPath": "/diagnostic/tmt-stress",
  "regulations": [
    {
      "body": "ACC/AHA",
      "citation": "Exercise Testing Guidelines",
      "requirement": "Bruce protocol 7 stages. Auto METs & target HR calculation. ST-segment monitoring. Emergency equipment checklist mandatory."
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
      "key": "protocolUsed",
      "label": "Protocol"
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
      "key": "protocolUsed",
      "label": "Protocol",
      "type": "select",
      "options": [
        "Bruce",
        "Modified Bruce",
        "Naughton",
        "Balke"
      ]
    },
    {
      "key": "restingHr",
      "label": "Resting HR",
      "type": "number"
    },
    {
      "key": "targetHr",
      "label": "Target HR",
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
