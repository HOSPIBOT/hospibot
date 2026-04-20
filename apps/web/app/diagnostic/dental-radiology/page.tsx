'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "dental-radiology",
  "title": "Dental Radiology",
  "subtitle": "OPG \u00b7 CBCT \u00b7 Cephalogram \u00b7 Periapical \u00b7 AERB Licensed",
  "apiPath": "/diagnostic/dental-radiology",
  "regulations": [
    {
      "body": "AERB",
      "citation": "Dental Radiology Licensing",
      "requirement": "AERB license mandatory. Pregnancy screening. Lead apron + thyroid shield."
    }
  ],
  "columns": [
    {
      "key": "scanDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "scanType",
      "label": "Type"
    },
    {
      "key": "referringDentist",
      "label": "Dentist"
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
      "key": "scanType",
      "label": "Scan Type",
      "type": "select",
      "required": true,
      "options": [
        "opg",
        "cbct",
        "cephalogram",
        "periapical",
        "bitewing",
        "tmj"
      ]
    },
    {
      "key": "referringDentist",
      "label": "Referring Dentist",
      "type": "text"
    },
    {
      "key": "pregnancyScreened",
      "label": "Pregnancy Screened",
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
