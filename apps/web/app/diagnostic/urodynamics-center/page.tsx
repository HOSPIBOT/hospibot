'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "urodynamics-center",
  "title": "Urodynamics Center",
  "subtitle": "Uroflowmetry \u00b7 Cystometry \u00b7 Pressure-Flow \u00b7 EMG \u00b7 BOOI",
  "apiPath": "/diagnostic/urodynamics-center",
  "regulations": [
    {
      "body": "ICS",
      "citation": "International Continence Society Standards",
      "requirement": "ICS standardized terminology. Equipment calibration. Infection control for catheter procedures."
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
      "key": "qmax",
      "label": "Qmax"
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
        "video-urodynamics",
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
      "key": "booiIndex",
      "label": "BOOI Index",
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
