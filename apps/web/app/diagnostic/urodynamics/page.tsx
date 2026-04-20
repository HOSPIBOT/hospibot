'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "urodynamics",
  "title": "Urodynamics",
  "subtitle": "Uroflowmetry \u00b7 Cystometry \u00b7 Pressure-Flow \u00b7 BOOI",
  "apiPath": "/diagnostic/urodynamics",
  "regulations": [
    {
      "body": "ICS",
      "citation": "Urodynamics Standards",
      "requirement": "Qmax, voided volume, PVR. Cystometry: detrusor pressure, compliance. BOOI index."
    }
  ],
  "columns": [
    {
      "key": "studyDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "studyType",
      "label": "Type"
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
      "key": "studyType",
      "label": "Type",
      "type": "select",
      "options": [
        "uroflowmetry",
        "cystometry",
        "pressure-flow",
        "comprehensive"
      ]
    },
    {
      "key": "qmax",
      "label": "Qmax (ml/s)",
      "type": "number"
    },
    {
      "key": "voidedVolumeMl",
      "label": "Voided Volume (ml)",
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
