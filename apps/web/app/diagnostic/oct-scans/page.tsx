'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "oct-scans",
  "title": "OCT Scans",
  "subtitle": "RNFL Thickness \u00b7 Macular Map \u00b7 Glaucoma/DME \u00b7 Signal \u22655",
  "apiPath": "/diagnostic/oct-scans",
  "regulations": [
    {
      "body": "Ophthalmology",
      "citation": "ETDRS Grid, RNFL Standards",
      "requirement": "Signal strength \u22655 for valid scan. RNFL thickness tracking. ETDRS 9-zone macular map."
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
      "key": "eye",
      "label": "Eye"
    },
    {
      "key": "scanProtocol",
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
      "key": "eye",
      "label": "Eye",
      "type": "select",
      "required": true,
      "options": [
        "OD",
        "OS",
        "OU"
      ]
    },
    {
      "key": "scanProtocol",
      "label": "Protocol",
      "type": "select",
      "options": [
        "Macula",
        "RNFL",
        "ONH",
        "GCC",
        "Wide-Field"
      ]
    },
    {
      "key": "signalStrength",
      "label": "Signal Strength",
      "type": "number",
      "placeholder": "\u22655 required"
    },
    {
      "key": "rnflAvg",
      "label": "RNFL Avg (\u00b5m)",
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
