'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "opg-cbct",
  "title": "OPG / CBCT",
  "subtitle": "Dental Imaging \u00b7 Panoramic \u00b7 3D Cone Beam \u00b7 AERB Licensed",
  "apiPath": "/diagnostic/opg-cbct",
  "regulations": [
    {
      "body": "AERB",
      "citation": "Dental Radiology Licensing",
      "requirement": "AERB license mandatory. CBCT dose ~36\u00b5Sv. Pregnancy screening. Lead apron/thyroid shield."
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
        "bitewing"
      ]
    },
    {
      "key": "referringDentist",
      "label": "Referring Dentist",
      "type": "text"
    },
    {
      "key": "clinicalIndication",
      "label": "Indication",
      "type": "text"
    },
    {
      "key": "pregnancyScreenDone",
      "label": "Pregnancy Screen",
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
