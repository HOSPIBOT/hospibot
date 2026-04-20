'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "ophthalmic-diagnostics",
  "title": "Ophthalmic Diagnostics",
  "subtitle": "OCT \u00b7 Perimetry \u00b7 Fundus \u00b7 FFA \u00b7 Topography \u00b7 ERG",
  "apiPath": "/diagnostic/ophthalmic-diagnostics",
  "regulations": [
    {
      "body": "Ophthalmology",
      "citation": "ETDRS, RNFL Standards, Humphrey VF",
      "requirement": "OCT signal strength \u22655. VF reliability: FL<20%, FP<15%, FN<33%. DR grading per ETDRS."
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
      "key": "testType",
      "label": "Test"
    },
    {
      "key": "eye",
      "label": "Eye"
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
      "key": "testType",
      "label": "Test",
      "type": "select",
      "required": true,
      "options": [
        "oct-rnfl",
        "oct-macula",
        "perimetry",
        "fundus-photo",
        "ffa",
        "topography",
        "iob-biometry",
        "erp"
      ]
    },
    {
      "key": "eye",
      "label": "Eye",
      "type": "select",
      "options": [
        "OD",
        "OS",
        "OU"
      ]
    },
    {
      "key": "signalStrength",
      "label": "Signal Strength",
      "type": "number",
      "placeholder": "\u22655 required"
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
