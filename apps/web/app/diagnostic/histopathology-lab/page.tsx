'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "histopathology-lab",
  "title": "Histopathology Lab",
  "subtitle": "Biopsy \u00b7 FNAC \u00b7 Frozen Section \u00b7 IHC \u00b7 Pap Smear \u00b7 CAP Synoptic",
  "apiPath": "/diagnostic/histopathology-lab",
  "regulations": [
    {
      "body": "NABL",
      "citation": "Histopathology Scope, ISO 15189",
      "requirement": "Tissue block retention 10 years. Slide retention 5 years. CAP synoptic reporting for cancer. Bethesda system for cervical cytology."
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
      "key": "specimenType",
      "label": "Specimen"
    },
    {
      "key": "diagnosis",
      "label": "Diagnosis"
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
      "key": "specimenType",
      "label": "Specimen Type",
      "type": "select",
      "options": [
        "biopsy",
        "fnac",
        "pap-smear",
        "frozen-section",
        "fluid-cytology"
      ]
    },
    {
      "key": "specimenSource",
      "label": "Source",
      "type": "text"
    },
    {
      "key": "clinicalHistory",
      "label": "Clinical History",
      "type": "textarea",
      "span": 2
    },
    {
      "key": "frozenSection",
      "label": "Frozen Section",
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
