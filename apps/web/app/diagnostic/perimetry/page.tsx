'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "perimetry",
  "title": "Perimetry",
  "subtitle": "Humphrey VF \u00b7 MD/PSD/VFI \u00b7 Glaucoma \u00b7 Reliability",
  "apiPath": "/diagnostic/perimetry",
  "regulations": [
    {
      "body": "Ophthalmology",
      "citation": "Humphrey VF Standards",
      "requirement": "Reliability: FL<20%, FP<15%, FN<33%. MD/PSD/VFI indices. GHT result."
    }
  ],
  "columns": [
    {
      "key": "testDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "eye",
      "label": "Eye"
    },
    {
      "key": "testPattern",
      "label": "Pattern"
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
      "key": "eye",
      "label": "Eye",
      "type": "select",
      "required": true,
      "options": [
        "OD",
        "OS"
      ]
    },
    {
      "key": "testType",
      "label": "Device",
      "type": "select",
      "options": [
        "humphrey",
        "goldmann",
        "octopus"
      ]
    },
    {
      "key": "testPattern",
      "label": "Pattern",
      "type": "select",
      "options": [
        "24-2",
        "30-2",
        "10-2"
      ]
    },
    {
      "key": "meanDeviation",
      "label": "MD (dB)",
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
